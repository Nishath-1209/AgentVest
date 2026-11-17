
from functools import lru_cache
from uuid import uuid4

from astrapy import DataAPIClient
from astrapy.info import CollectionDefinition, CollectionVectorOptions
from sentence_transformers import SentenceTransformer

from app.core.config import settings


COLLECTION_NAME = "financial_report_chunks"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
VECTOR_DIMENSION = 384


@lru_cache(maxsize=1)
def get_embedding_model():
    return SentenceTransformer(EMBEDDING_MODEL)


@lru_cache(maxsize=1)
def get_collection():
    if not settings.astra_db_api_endpoint:
        raise ValueError("ASTRA_DB_API_ENDPOINT is missing")

    if not settings.astra_db_application_token:
        raise ValueError("ASTRA_DB_APPLICATION_TOKEN is missing")

    client = DataAPIClient(
        token=settings.astra_db_application_token
    )

    database = client.get_database(
        settings.astra_db_api_endpoint,
        keyspace=settings.astra_db_keyspace,
    )

    existing = database.list_collection_names()

    if COLLECTION_NAME not in existing:
        database.create_collection(
        COLLECTION_NAME,
        definition=CollectionDefinition(
            vector=CollectionVectorOptions(
                dimension=VECTOR_DIMENSION,
                metric="cosine",
            )
        ),
    )

    return database.get_collection(COLLECTION_NAME)


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    model = get_embedding_model()
    vectors = model.encode(
        texts,
        normalize_embeddings=True,
        show_progress_bar=False,
    )

    return vectors.tolist()


def index_report(
    chunks: list[dict],
    filename: str,
    ticker: str,
) -> dict:
    if not chunks:
        raise ValueError("No report chunks to index")

    ticker = ticker.upper().strip()
    collection = get_collection()

    vectors = embed_texts(
        [chunk["text"] for chunk in chunks]
    )

    report_id = str(uuid4())
    documents = []

    for chunk, vector in zip(chunks, vectors):
        documents.append({
            "_id": str(uuid4()),
            "$vector": vector,
            "report_id": report_id,
            "ticker": ticker,
            "filename": filename,
            "page_number": chunk["page_number"],
            "chunk_id": chunk["chunk_id"],
            "text": chunk["text"],
        })

    for start in range(0, len(documents), 20):
        collection.insert_many(
            documents[start:start + 20]
        )

    return {
        "report_id": report_id,
        "ticker": ticker,
        "filename": filename,
        "chunks_indexed": len(documents),
    }


def search_report(
    question: str,
    ticker: str,
    limit: int = 5,
    report_id: str | None = None,
) -> list[dict]:
    ticker = ticker.upper().strip()

    if not question.strip():
        raise ValueError("Question cannot be empty")

    if not ticker:
        raise ValueError("Stock ticker is required")

    if limit < 1 or limit > 20:
        raise ValueError("Limit must be between 1 and 20")

    filters = {"ticker": ticker}

    if report_id:
        filters["report_id"] = report_id

    vector = embed_texts([question])[0]
    collection = get_collection()

    results = collection.find(
        filters,
        sort={"$vector": vector},
        limit=limit,
        include_similarity=True,
    )

    matches = []

    for result in results:
        matches.append({
            "report_id": result.get("report_id"),
            "filename": result.get("filename"),
            "page_number": result.get("page_number"),
            "text": result.get("text"),
            "similarity": result.get("$similarity"),
        })

    return matches
