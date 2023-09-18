/**
 * Download a blob with and use the specified filename.
 *
 * @param blob
 * @param filename
 */
export const downloadBlobFile = (blob: Blob, filename: string) => {
	const modelFile = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.style.display = "none";
	link.href = modelFile;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(link.href);
};

/**
 * Fetch and download a file.
 * If provided a token, use that token in the Authorization header.
 *
 * @param url
 * @param filename
 * @param token
 */
export const fetchFileWithToken = async (url: string, filename: string, token: string | null = null) => {
	const res = await fetch(url, {
		...(token ? { headers: { Authorization: token } } : {}),
	});
	const blob = await res.blob();
	downloadBlobFile(blob, filename);
};
