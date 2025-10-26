import { useRef, useState } from 'react';
const BACKEND_URL = 'https://learnback-twta.onrender.com';

export default function LogoUploader() {
    const logoFileInput = useRef(null);
    const [logoPreview, setLogoPreview] = useState('/upload-logo.svg');
    const [logoUploadStatus, setLogoUploadStatus] = useState('');
    const [tokenUri, setTokenUri] = useState('');

    async function handleLogoUpload(file) {
        if (!file) {
            setLogoUploadStatus('Выберите файл!');
            setLogoPreview('/upload-logo.svg');
            return;
        }

        setLogoUploadStatus('Загрузка логотипа...');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${BACKEND_URL}/api/upload-logo`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (res.ok && typeof data.ipfsUrl === "string") {
                setLogoUploadStatus('✅ Лог��тип загружен!');
                setLogoPreview(data.ipfsUrl.replace(/https:\/\/[^\/]+\/ipfs\//, "https://gateway.pinata.cloud/ipfs/"));
                setTokenUri(data.ipfsUrl);
            } else {
                setLogoUploadStatus(`❌ Ошибка: ${data.error || 'Не удалось загрузить логотип.'}`);
                setLogoPreview('/upload-logo.svg');
            }
        } catch (err) {
            setLogoUploadStatus(`❌ Ошибка: ${err.message}`);
            setLogoPreview('/upload-logo.svg');
        }
    }

    function onFileChange(e) {
        const file = e.target.files?.[0];
        if (file) handleLogoUpload(file);
    }

    function onDrop(e) {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleLogoUpload(file);
    }

    function onDragOver(e) {
        e.preventDefault();
    }

    return (<div>
        <div style={{ border: '2px dashed #1E88E5', padding: '24px', cursor: 'pointer', borderRadius: '12px', textAlign: 'center' }} onClick={() => logoFileInput.current.click()} onDrop={onDrop} onDragOver={onDragOver}>
            <img src={logoPreview} alt="Логотип" style={{ width: 96, height: 96, marginBottom: 10 }} />
            <div>Нажмите или перетащите файл для загрузки логотипа</div>
            <input type="file" accept="image/*" ref={logoFileInput} style={{ display: 'none' }} onChange={onFileChange} />
        </div>
        <div style={{ marginTop: 16, minHeight: 24 }}>{logoUploadStatus}</div>
        {tokenUri && (
            <div style={{ marginTop: 8 }}>
                <strong>IPFS URI:</strong> <a href={tokenUri} target="_blank" rel="noopener noreferrer">{tokenUri}</a>
            </div>
        )}
    </div>);
}