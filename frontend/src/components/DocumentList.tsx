import { useState, useEffect } from 'react';

interface Document {
  stored_filename: string;
  original_filename: string;
  doc_type: string;
  date_added: string;
}

function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setDocuments(data.data);
      } else {
        setError(data.message);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDownload = (filename: string) => {
    window.open(`/api/documents/${filename}`, '_blank');
  };

  const handleDelete = async (filename: string) => {
    if (window.confirm(`Are you sure you want to delete ${filename}?`)) {
      try {
        const response = await fetch(`/api/documents/${filename}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          fetchDocuments(); // Refresh the list
        } else {
          setError(data.message || 'An unknown error occurred during deletion.');
        }
      } catch (e: any) {
        setError(`Error deleting document: ${e.message}`);
      }
    }
  };

  if (loading) {
    return <div>Loading documents...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Document Management</h2>
      {documents.length === 0 ? (
        <p>No documents found. Upload some!</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Original Filename</th>
              <th>Document Type</th>
              <th>Date Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.stored_filename}>
                <td>{doc.original_filename}</td>
                <td>{doc.doc_type}</td>
                <td>{new Date(doc.date_added).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleDownload(doc.stored_filename)}>Download</button>
                  <button onClick={() => handleDelete(doc.stored_filename)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DocumentList;
