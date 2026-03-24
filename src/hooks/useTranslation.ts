import { useCallback } from 'react';

export const useTranslation = () => {
    const translateText = useCallback(async (text: string, signal?: AbortSignal): Promise<string> => {
        if (!text) return '';

        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text }),
                signal
            });

            if (!response.ok) return '';

            const data = await response.json();
            return data.translation || '';
        } catch (err) {
            console.error("Translation error", err);
            return '';
        }
    }, []);

    return { translateText };
};
