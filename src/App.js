import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import Webcam from 'react-webcam';
import Quagga from 'quagga';
import jsQR from 'jsqr';

function App() {
  const [image, setImage] = useState(null);
  const [ocrResult, setOcrResult] = useState('');
  const [barcodeResult, setBarcodeResult] = useState('');
  const [qrResult, setQrResult] = useState('');
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const webcamRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        performBarcodeDetection(reader.result);
        performQRDetection(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = () => {
    const screenshot = webcamRef.current.getScreenshot();
    setImage(screenshot);
    setIsWebcamOpen(false);
    performBarcodeDetection(screenshot);
    performQRDetection(screenshot);
  };

  const performBarcodeDetection = (src) => {
    Quagga.decodeSingle({
      src,
      numOfWorkers: 0,
      inputStream: {
        size: 800  // set this to an appropriate size
      },
      decoder: {
        readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader"]
      }
    }, (result) => {
      if (result && result.codeResult) {
        setBarcodeResult(result.codeResult.code);
      } else {
        setBarcodeResult('');
      }
    });
  };

  const performQRDetection = (src) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
      if (qrCode) {
        setQrResult(qrCode.data);
      } else {
        setQrResult('');
      }
    };
  };

  const performOCR = () => {
    if (image) {
      Tesseract.recognize(
        image,
        'eng',
        {
          logger: (m) => console.log(m)
        }
      ).then(({ data: { text } }) => {
        setOcrResult(text);
      });
    }
  };

  const downloadResult = () => {
    const element = document.createElement("a");
    const fileContent = ocrResult || barcodeResult || qrResult;
    const file = new Blob([fileContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "ocr_result.txt";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1 style={{fontSize:"45px", fontFamily:"cursive", fontWeight:"lighter"}}>Conversor de Imagens</h1>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '50px', marginTop: '50px',marginBottom:"40px" }}>
        
        <div style={{ borderStyle:"dashed", width: '155px',
                      height: '155px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', opacity:"70%", cursor:"pointer", borderRadius:"10px" }}>
          
          <label style={{ cursor: 'pointer', fontSize:"25px", fontWeight:"bold" }}>
            Arquivo Computador
            <input type="file" accept="image/png/jpeg" style={{ display: 'none' }} onChange={handleFileChange} />
          </label>
        
        </div>
        <div style={{ borderStyle:"dashed", width: '155px', 
                      height: '155px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer', opacity:"70%", 
                      borderRadius:"10px" }} onClick={() => setIsWebcamOpen(true)}>
          
          <label style={{ cursor: 'pointer', fontSize:"25px", fontWeight:"bold"  }}>
            Tirar Foto
          </label>
        
        </div>
      </div>
      {isWebcamOpen && (
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/png"
          height={250}
        />
      )}
      {isWebcamOpen && <button style={{fontSize:"20px", borderRadius:"10px", marginTop:"50px", 
                                       display:"flex", justifyContent:"center", alignItems:"center", 
                                       marginLeft:"47%"}} onClick={handleCapture}>Capturar Foto</button>}

      {image && <img src={image} alt="Uploaded" style={{ marginTop: '20px', maxWidth: '400px'}} />}
      <div style={{ marginTop: '40px', marginBottom:"40px" }}>
        {isWebcamOpen || image && <button style={{fontSize:"20px", borderRadius:"10px"}} onClick={performOCR}>Extrair Texto</button>}
        {ocrResult && (
          <>
            <p style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>{ocrResult}</p>
          </>
        )}
        {barcodeResult && (
          <>
            <p style={{ marginTop: '20px' }}>Código de Barras: {barcodeResult}</p>
          </>
        )}
        {qrResult && (
          <>
            <p style={{ marginTop: '20px' }}>QR Code: {qrResult}</p>
          </>
        )}
        {(ocrResult || barcodeResult || qrResult) && (
          <button style={{marginBottom: "30px", fontSize:"20px", borderRadius:"10px"}} onClick={downloadResult}>Download Resultado</button>
        )}
      </div>
    </div>
  );
}

export default App;