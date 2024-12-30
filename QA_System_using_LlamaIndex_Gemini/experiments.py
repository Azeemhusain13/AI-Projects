import os
from dotenv import load_dotenv
load_dotenv()

google_api = os.getenv("GOOGLE_API_KEY")
# print(google_api)

from llama_index.llms.gemini import Gemini

import google.generativeai as genai

from llama_index.core import SimpleDirectoryReader

from llama_index.core import Settings


from IPython.display import Markdown, display

from llama_index.core import ServiceContext

from llama_index.core import StorageContext, load_index_from_storage

from llama_index.embeddings.gemini import GeminiEmbedding
from llama_index.core import DocumentSummaryIndex

genai.configure(api_key = google_api)
# for models in genai.list_models():
#     print(models)

# for models in genai.list_models():
#   if 'generateContent' in models.supported_generation_methods:
#     print(models.name)

documents=SimpleDirectoryReader(input_dir="/Users/admin/Desktop/sample_project/AI-Projects/QA_System_using_LlamaIndex_Gemini", required_exts=[".pdf"])
doc=documents.load_data()
# print(doc[0].text)
model=Gemini(models='gemini-pro',api_key=google_api)
gemini_embed_model=GeminiEmbedding(model_name="models/embedding-001")
# Configure Settings
index = DocumentSummaryIndex.from_documents(
    documents, embed_model=gemini_embed_model, llm=model
)
index
query_engine=index.as_query_engine()
response=query_engine.query("linear regression?")
print(response.response)