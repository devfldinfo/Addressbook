import os
import dill
import json
import glob
import errno

from googleapiclient.discovery import build
from google.oauth2 import service_account


class Getter:
    SCOPES = ['https://www.googleapis.com/auth/documents.readonly']

    def __init__(self,
                 credentials_filepath: str = glob.glob('**/credentials.json', recursive=True)[0],
                 doc_id_filepath: str = glob.glob('**/document_id.json', recursive=True)[0]):

        if not os.path.isfile(doc_id_filepath):
            raise FileNotFoundError(errno.ENOENT, os.strerror(errno.ENOENT), doc_id_filepath)

        if not os.path.isfile(doc_id_filepath):
            raise FileNotFoundError(errno.ENOENT, os.strerror(errno.ENOENT), doc_id_filepath)

        self.__creds = service_account.Credentials.from_service_account_file(credentials_filepath, scopes=self.SCOPES)
        self.__doc_id = ''

        with open(doc_id_filepath, 'r') as f:
            self.__doc_id = json.load(f)['id']

    def download_and_get(self, saveto: str = None):
        creds = self.__creds
        doc_id = self.__doc_id

        service = build('docs', 'v1', credentials=creds)

        # Retrieve the documents contents from the Docs service.
        document = service.documents().get(documentId=doc_id).execute()

        print('Document downloaded successfully!')
        print(f'The title of the document is: {document.get("title")}')

        doc_content = document.get('body').get('content')

        if saveto:
            # save file as is
            with open(saveto + '.pkl', 'wb') as pkl_f:
                dill.dump(doc_content, pkl_f)

            with open(saveto + '.json', 'w') as f:
                f.write(json.dumps(doc_content, indent=4))

            print(f'Document saved successfully as {saveto + ".json"}!')

        return doc_content



def main():
    g = Getter()
    # doc_content = g.download_and_get()
    doc_content = g.download_and_get(saveto='data_jar/getter_output')
    print(doc_content)


if __name__ == '__main__':
    main()
