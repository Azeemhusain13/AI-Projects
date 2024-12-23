from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from dotenv import load_dotenv
load_dotenv()
def main(url: str) -> None:
    documents = SimpleDirectoryReader(url).load_data()
    index = VectorStoreIndex.from_documents(documents)
    query_engine = index.as_query_engine()
    response = query_engine.query("What did the author do growing up?")
    print(response)

if __name__ == "__main__":
    main(url = "/Users/admin/Desktop/sample_project/AI-Projects/QA_Using_LlamaIndex_OpenAI/Master Machine Learning Algorithms-Linear Algorithms -Note-1.pdf")
