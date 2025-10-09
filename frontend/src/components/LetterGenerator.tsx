import { useState, ChangeEvent, FormEvent } from 'react';

type LetterType = 'tender' | 'ptp' | 'fcra';

function LetterGenerator() {
  const [currentLetterType, setCurrentLetterType] = useState<LetterType>('tender');

  // State for Tender Letter
  const [tenderUserName, setTenderUserName] = useState<string>('');
  const [tenderUserAddress, setTenderUserAddress] = useState<string>('');
  const [tenderCreditorName, setTenderCreditorName] = useState<string>('');
  const [tenderCreditorAddress, setTenderCreditorAddress] = useState<string>('');
  const [tenderBillFileName, setTenderBillFileName] = useState<string>('');

  // State for PTP Letter
  const [ptpUserName, setPtpUserName] = useState<string>('');
  const [ptpUserAddress, setPtpUserAddress] = useState<string>('');
  const [ptpCreditorName, setPtpCreditorName] = useState<string>('');
  const [ptpCreditorAddress, setPtpCreditorAddress] = useState<string>('');
  const [ptpAccountNumber, setPtpAccountNumber] = useState<string>('');
  const [ptpPromiseAmount, setPtpPromiseAmount] = useState<string>('');
  const [ptpPromiseDate, setPtpPromiseDate] = useState<string>('');

  // State for FCRA Dispute Letter
  const [fcraUserName, setFcraUserName] = useState<string>('');
  const [fcraUserAddress, setFcraUserAddress] = useState<string>('');
  const [fcraAccountNumber, setFcraAccountNumber] = useState<string>('');
  const [fcraReason, setFcraReason] = useState<string>('');
  const [fcraViolationTemplate, setFcraViolationTemplate] = useState<string>('');
  const [fcraSelectedBureaus, setFcraSelectedBureaus] = useState<string[]>([]);

  const [generatedLetterContent, setGeneratedLetterContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateLetter = async (endpoint: string, data: object) => {
    setLoading(true);
    setError(null);
    setGeneratedLetterContent('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate letter due to server error.');
      }

      if (result.letterContent) {
        setGeneratedLetterContent(result.letterContent);
      } else {
        setError('Unexpected response from server.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const renderTenderLetterForm = () => (
    <div>
      <h3>Generate Tender Letter</h3>
      <form onSubmit={(e: FormEvent) => {
        e.preventDefault();
        handleGenerateLetter('/generate-tender-letter', {
          userName: tenderUserName,
          userAddress: tenderUserAddress,
          creditorName: tenderCreditorName,
          creditorAddress: tenderCreditorAddress,
          billFileName: tenderBillFileName,
        });
      }}>
        <label>Your Name: <input type="text" value={tenderUserName} onChange={(e: ChangeEvent<HTMLInputElement>) => setTenderUserName(e.target.value)} required /></label><br />
        <label>Your Address: <input type="text" value={tenderUserAddress} onChange={(e: ChangeEvent<HTMLInputElement>) => setTenderUserAddress(e.target.value)} required /></label><br />
        <label>Creditor Name: <input type="text" value={tenderCreditorName} onChange={(e: ChangeEvent<HTMLInputElement>) => setTenderCreditorName(e.target.value)} required /></label><br />
        <label>Creditor Address: <input type="text" value={tenderCreditorAddress} onChange={(e: ChangeEvent<HTMLInputElement>) => setTenderCreditorAddress(e.target.value)} required /></label><br />
        <label>Bill File Name: <input type="text" value={tenderBillFileName} onChange={(e: ChangeEvent<HTMLInputElement>) => setTenderBillFileName(e.target.value)} required /></label><br />
        <button type="submit" disabled={loading}>Generate Tender Letter</button>
      </form>
    </div>
  );

  const renderPTPLetterForm = () => (
    <div>
      <h3>Generate Promise to Pay Letter</h3>
      <form onSubmit={(e: FormEvent) => {
        e.preventDefault();
        handleGenerateLetter('/generate-ptp-letter', {
          userName: ptpUserName,
          userAddress: ptpUserAddress,
          creditorName: ptpCreditorName,
          creditorAddress: ptpCreditorAddress,
          accountNumber: ptpAccountNumber,
          promiseAmount: ptpPromiseAmount,
          promiseDate: ptpPromiseDate,
        });
      }}>
        <label>Your Name: <input type="text" value={ptpUserName} onChange={(e: ChangeEvent<HTMLInputElement>) => setPtpUserName(e.target.value)} required /></label><br />
        <label>Your Address: <input type="text" value={ptpUserAddress} onChange={(e: ChangeEvent<HTMLInputElement>) => setPtpUserAddress(e.target.value)} required /></label><br />
        <label>Creditor Name: <input type="text" value={ptpCreditorName} onChange={(e: ChangeEvent<HTMLInputElement>) => setPtpCreditorName(e.target.value)} required /></label><br />
        <label>Creditor Address: <input type="text" value={ptpCreditorAddress} onChange={(e: ChangeEvent<HTMLInputElement>) => setPtpCreditorAddress(e.target.value)} required /></label><br />
        <label>Account Number: <input type="text" value={ptpAccountNumber} onChange={(e: ChangeEvent<HTMLInputElement>) => setPtpAccountNumber(e.target.value)} required /></label><br />
        <label>Promise Amount: <input type="number" value={ptpPromiseAmount} onChange={(e: ChangeEvent<HTMLInputElement>) => setPtpPromiseAmount(e.target.value)} required /></label><br />
        <label>Promise Date: <input type="date" value={ptpPromiseDate} onChange={(e: ChangeEvent<HTMLInputElement>) => setPtpPromiseDate(e.target.value)} required /></label><br />
        <button type="submit" disabled={loading}>Generate PTP Letter</button>
      </form>
    </div>
  );

  const renderFCRADisputeForm = () => (
    <div>
      <h3>Generate FCRA Dispute Letter</h3>
      <form onSubmit={(e: FormEvent) => {
        e.preventDefault();
        handleGenerateLetter('/api/generate-fcra-dispute', {
          userName: fcraUserName,
          userAddress: fcraUserAddress,
          accountNumber: fcraAccountNumber,
          reason: fcraReason,
          violationTemplate: fcraViolationTemplate,
          selectedBureaus: fcraSelectedBureaus,
        });
      }}>
        <label>Your Name: <input type="text" value={fcraUserName} onChange={(e: ChangeEvent<HTMLInputElement>) => setFcraUserName(e.target.value)} required /></label><br />
        <label>Your Address: <input type="text" value={fcraUserAddress} onChange={(e: ChangeEvent<HTMLInputElement>) => setFcraUserAddress(e.target.value)} required /></label><br />
        <label>Account Number: <input type="text" value={fcraAccountNumber} onChange={(e: ChangeEvent<HTMLInputElement>) => setFcraAccountNumber(e.target.value)} required /></label><br />
        <label>Reason for Dispute: <textarea value={fcraReason} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFcraReason(e.target.value)} required></textarea></label><br />
        <label>Violation Template: <textarea value={fcraViolationTemplate} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFcraViolationTemplate(e.target.value)}></textarea></label><br />
        <label>Select Bureaus:</label><br />
        <input type="checkbox" id="equifax" value="equifax" checked={fcraSelectedBureaus.includes('equifax')} onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const newBureaus = e.target.checked ? [...fcraSelectedBureaus, 'equifax'] : fcraSelectedBureaus.filter(b => b !== 'equifax');
          setFcraSelectedBureaus(newBureaus);
        }} /> <label htmlFor="equifax">Equifax</label><br />
        <input type="checkbox" id="experian" value="experian" checked={fcraSelectedBureaus.includes('experian')} onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const newBureaus = e.target.checked ? [...fcraSelectedBureaus, 'experian'] : fcraSelectedBureaus.filter(b => b !== 'experian');
          setFcraSelectedBureaus(newBureaus);
        }} /> <label htmlFor="experian">Experian</label><br />
        <input type="checkbox" id="transunion" value="transunion" checked={fcraSelectedBureaus.includes('transunion')} onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const newBureaus = e.target.checked ? [...fcraSelectedBureaus, 'transunion'] : fcraSelectedBureaus.filter(b => b !== 'transunion');
          setFcraSelectedBureaus(newBureaus);
        }} /> <label htmlFor="transunion">TransUnion</label><br />
        <button type="submit" disabled={loading}>Generate FCRA Dispute Letter</button>
      </form>
    </div>
  );

  return (
    <div>
      <h2>Letter Generator</h2>
      <nav>
        <button onClick={() => setCurrentLetterType('tender')}>Tender Letter</button>
        <button onClick={() => setCurrentLetterType('ptp')}>PTP Letter</button>
        <button onClick={() => setCurrentLetterType('fcra')}>FCRA Dispute</button>
      </nav>
      <hr />
      {currentLetterType === 'tender' && renderTenderLetterForm()}
      {currentLetterType === 'ptp' && renderPTPLetterForm()}
      {currentLetterType === 'fcra' && renderFCRADisputeForm()}

      {loading && <p>Generating letter...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {generatedLetterContent && (
        <div>
          <h3>Generated Letter:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', border: '1px solid #ccc', padding: '10px' }}>
            {generatedLetterContent}
          </pre>
        </div>
      )}
    </div>
  );
}

export default LetterGenerator;
