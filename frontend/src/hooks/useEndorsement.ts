import { useState } from 'react';
import { AppError, AppErrorHandler, ErrorCode } from '../utils/errorHandler';
import { EndorsementResponse } from '../types';
import { TypedApiClient } from '../services/apiClient';
import { API_CONFIG } from '../apiConfig';
import { API_ENDPOINTS } from '../types/api';

const apiClient = new TypedApiClient(API_CONFIG);

export const useEndorsement = () => {
    const [response, setResponse] = useState<EndorsementResponse | null>(null);
    const [error, setError] = useState<AppError | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    const endorseBill = async (file: File) => {
        // Validate file before processing
        const validationError = AppErrorHandler.validateFile(file, {
            maxSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: ['application/pdf']
        });

        if (validationError) {
            setError(validationError);
            AppErrorHandler.logError(validationError);
            return;
        }

        setIsProcessing(true);
        setError(null);
        setResponse(null);
        setUploadProgress(0);

        try {
            const apiResponse = await apiClient.upload<EndorsementResponse>(
                API_ENDPOINTS.ENDORSE_BILL,
                file,
                {
                    onUploadProgress: (progress: number) => {
                        setUploadProgress(progress);
                    }
                }
            );

            setIsProcessing(false);
            
            if (apiResponse.success && apiResponse.data) {
                setResponse(apiResponse.data);
                setError(null);
            } else {
                const error = AppErrorHandler.createError(
                    ErrorCode.API_ERROR,
                    'Server returned unexpected response format'
                );
                setError(error);
                AppErrorHandler.logError(error);
            }
        } catch (uploadError: any) {
            setIsProcessing(false);
            setError(uploadError);
            AppErrorHandler.logError(uploadError);
            setResponse(null);
        }
    };

    const clearError = () => {
        setError(null);
    };

    const reset = () => {
        setResponse(null);
        setError(null);
        setIsProcessing(false);
        setUploadProgress(0);
    };

    return { response, error, isProcessing, uploadProgress, endorseBill, clearError, reset };
};
