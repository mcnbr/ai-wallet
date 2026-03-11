from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2.credentials import Credentials

def upload_to_drive(file_path: str, access_token: str):
    """Uploads the local database to the user's Google Drive App Data folder."""
    creds = Credentials(token=access_token)
    service = build('drive', 'v3', credentials=creds)

    file_metadata = {
        'name': 'carteira.db',
        'parents': ['appDataFolder']
    }
    media = MediaFileUpload(file_path, mimetype='application/x-sqlite3')
    
    try:
        file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
        return file.get('id')
    except Exception as e:
        print(f"Erro no upload para o Drive: {e}")
        return None
