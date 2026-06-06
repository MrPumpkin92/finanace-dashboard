import React, { useRef } from 'react';

interface FilePickerProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  disabled?: boolean;
}

export const FilePicker: React.FC<FilePickerProps> = ({ onFileSelect, accept = '.csv', disabled = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        className="btn-secondary disabled:opacity-50"
      >
        📁 Import CSV
      </button>
    </>
  );
};

export default FilePicker;
