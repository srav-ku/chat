import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cloudinaryClient } from "@/lib/cloudinary";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  X, 
  Camera, 
  FileText, 
  MapPin,
  Image as ImageIcon,
  Video,
  File
} from "lucide-react";

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string | null;
  senderId: string;
}

export default function MediaModal({ isOpen, onClose, chatId, senderId }: MediaModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFiles([]);
      setUploadProgress(0);
      onClose();
    }
  };

  const handleFileSelect = (files: FileList) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const { supported } = cloudinaryClient.isFileTypeSupported(file);
      return supported;
    });

    if (validFiles.length !== fileArray.length) {
      toast({
        title: "Some files not supported",
        description: "Some files were filtered out due to unsupported format or size.",
        variant: "destructive"
      });
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files) {
      handleFileSelect(files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (file.type.startsWith('video/')) return <Video className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const getFileTypeColor = (file: File) => {
    if (file.type.startsWith('image/')) return 'text-green-500';
    if (file.type.startsWith('video/')) return 'text-blue-500';
    return 'text-gray-500';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const uploadFiles = async () => {
    if (!chatId || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Upload to server (which handles Cloudinary)
        const formData = new FormData();
        formData.append('file', file);
        formData.append('chatId', chatId);
        formData.append('senderId', senderId);
        formData.append('messageType', file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file');

        const response = await fetch('/api/upload/media', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        
        // Update progress
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      toast({
        title: "Upload Successful! 🎉",
        description: `${selectedFiles.length} file(s) uploaded and sent.`,
      });

      handleClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="media-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Share Media</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isUploading}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="button-close-media-modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-instagram-pink bg-instagram-pink/5' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-testid="drop-zone"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Drop files here or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
              data-testid="file-input"
            />
            <Button
              variant="outline"
              onClick={triggerFileSelect}
              disabled={isUploading}
              className="btn-outline-instagram"
              data-testid="button-browse-files"
            >
              Choose Files
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="flex flex-col items-center p-4 h-auto space-y-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={isUploading}
              data-testid="button-camera"
            >
              <Camera className="w-6 h-6 text-instagram-pink" />
              <span className="text-xs text-gray-600 dark:text-gray-300">Camera</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.doc,.docx,.txt';
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files) handleFileSelect(files);
                };
                input.click();
              }}
              className="flex flex-col items-center p-4 h-auto space-y-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={isUploading}
              data-testid="button-document"
            >
              <FileText className="w-6 h-6 text-instagram-purple" />
              <span className="text-xs text-gray-600 dark:text-gray-300">Document</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center p-4 h-auto space-y-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={isUploading}
              data-testid="button-location"
            >
              <MapPin className="w-6 h-6 text-success" />
              <span className="text-xs text-gray-600 dark:text-gray-300">Location</span>
            </Button>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Selected Files ({selectedFiles.length})
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    data-testid={`selected-file-${index}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`${getFileTypeColor(file)}`}>
                        {getFileIcon(file)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                      data-testid={`button-remove-file-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Uploading...</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1"
              data-testid="button-cancel-upload"
            >
              Cancel
            </Button>
            <Button
              onClick={uploadFiles}
              disabled={selectedFiles.length === 0 || isUploading}
              className="flex-1 btn-instagram"
              data-testid="button-upload-files"
            >
              {isUploading ? "Uploading..." : `Send ${selectedFiles.length} File(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
