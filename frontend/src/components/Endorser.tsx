import React, { useState } from 'react';

const Endorser: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            setError('Please select a file to endorse.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/endorse-bill/', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'An error occurred during endorsement.');
            }

            const data = await res.json();
            setResponse(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            setResponse(null);
        }
    };

    return (
        <div>
            <h2>Endorse a Bill</h2>
            <div>
                <input type="file" onChange={handleFileChange} accept=".pdf" />
                <button onClick={handleSubmit}>Endorse</button>
            </div>
            {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
            {response && (
                <div style={{ marginTop: '10px' }}>
                    <h3>{response.message}</h3>
                    {response.endorsed_files && (
                        <ul>
                            {response.endorsed_files.map((filePath: string, index: number) => (
                                <li key={index}>
                                    <a href={`/${filePath}`} target="_blank" rel="noopener noreferrer">{filePath}</a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default Endorser;
