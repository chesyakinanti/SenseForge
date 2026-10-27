import os
import time
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

try:
    import dns.resolver

    default_resolver = dns.resolver.get_default_resolver()
    fast_dns = ["1.1.1.1", "8.8.8.8"]
    default_resolver.nameservers = [
        ip for ip in fast_dns if ip not in default_resolver.nameservers
    ] + list(default_resolver.nameservers)
    default_resolver.lifetime = 3.0
    default_resolver.timeout = 2.0
except Exception:
    pass

try:
    import certifi

    CA_FILE = certifi.where()
except ImportError:
    CA_FILE = None

# Membaca konfigurasi dari file .env
load_dotenv(Path(__file__).resolve().parent / ".env")

MONGODB_URI = os.getenv("MONGODB_URI")
client_kwargs = {
    "serverSelectionTimeoutMS": 2500,
    "connectTimeoutMS": 2500,
    "socketTimeoutMS": 5000,
}
if CA_FILE and MONGODB_URI and "mongodb+srv://" in MONGODB_URI:
    client_kwargs["tlsCAFile"] = CA_FILE

client = None
db = None
if MONGODB_URI:
    try:
        client = MongoClient(MONGODB_URI, **client_kwargs)
        db = client["senseforge"]
    except Exception:
        client = None
        db = None

_unavailable_until = 0.0


def get_collection(name="sensor_data"):
    global client, db, _unavailable_until
    if not MONGODB_URI:
        raise RuntimeError("MONGODB_URI belum diatur di file .env")
    now = time.monotonic()
    if now < _unavailable_until:
        raise RuntimeError("MongoDB Atlas sedang tidak dapat dijangkau (circuit breaker aktif)")

    if client is None or db is None:
        try:
            client = MongoClient(MONGODB_URI, **client_kwargs)
            db = client["senseforge"]
        except Exception as exc:
            _unavailable_until = time.monotonic() + 30.0
            raise RuntimeError(f"Koneksi MongoDB gagal: {exc}") from exc

    try:
        client.admin.command("ping")
    except Exception as exc:
        _unavailable_until = time.monotonic() + 30.0
        raise RuntimeError(f"Koneksi MongoDB gagal: {exc}") from exc
    return db[name]


def test_connection():
    try:
        if client is None:
            raise RuntimeError("MONGODB_URI belum diatur di file .env")
        client.admin.command("ping")
        print("Koneksi MongoDB berhasil!")
        print("Database:", db.name)
    except Exception as e:
        print("Koneksi MongoDB gagal.")
        print("Detail error:", e)


def close_connection():
    if client is not None:
        client.close()


if __name__ == "__main__":
    test_connection()
