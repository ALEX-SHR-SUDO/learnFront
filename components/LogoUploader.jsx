import React, { useState } from 'react';

export default function LogoUploader() {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <p>Компонент загрузки логотипа</p>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {preview && (
        <div>
          <h4>Предпросмотр логотипа:</h4>
          <img src={preview} alt="Logo Preview" style={{ maxWidth: 200, maxHeight: 200 }} />
        </div>
      )}
    </div>
  );
}
