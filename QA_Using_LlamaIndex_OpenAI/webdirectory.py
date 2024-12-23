from llama_index.core import VectorStoreIndex
from llama_index.readers.web import SimpleWebPageReader

import os
from dotenv import load_dotenv
import logging
import sys

load_dotenv()
# print(os.environ["OPENAI_API_KEY"])

def main(url: str) -> None:
    document = SimpleWebPageReader(html_to_text=True).load_data(urls = [url])
    index = VectorStoreIndex.from_documents(documents=document)
    query_engine = index.as_query_engine()
    response = query_engine.query("What o1 Does")
    print(response)

if __name__ == "__main__":
    main(url = "https://medium.com/@dorians/openai-o1-says-theres-a-wall-ffe8deb4b48f")