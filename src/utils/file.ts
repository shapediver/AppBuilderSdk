import { guessMimeTypeFromFilename } from "@shapediver/viewer.utils.mime-type";

/**
 * Given a file name, extract the file extension. 
 * @param fileName 
 * @returns 
 */
export const getFileExtension = (fileName: string) => {
	const match = fileName.match(/\.([0-9a-z]+)$/i);
  
	return (match && match[1]) ? match[1].toLowerCase() : undefined;
};

/**
 * Guess the mime type of a file by its extension.
 * @param fileName 
 * @returns 
 */
export const guessMimeTypeByExt = (fileName: string) => {
	return guessMimeTypeFromFilename(fileName)[0];
};

/**
 * In case a file is missing a mime type, try to guess it from the file name.
 * @param file 
 * @returns 
 */
export const guessMissingMimeType = (file: File | string) : File | string => {
	if (typeof(file) === "string") {
		return file;
	}
	if (file.type) {
		return file;
	}

	return new File([file], file.name, { type: guessMimeTypeByExt(file.name) });
};

/**
 * Download a blob and use the specified filename.
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
 * Download a blob and use the specified filename with the save as dialog.
 * @param blob 
 * @param filename 
 * @returns 
 */
export const downloadBlobFileSaveAs = async (blob: Blob, filename: string) => {
	const isSupported = window && "showSaveFilePicker" in window;
  
	if (!isSupported) return downloadBlobFile(blob, filename);
  
	const extension = getFileExtension(filename);
  
	try {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const handle = await window.showSaveFilePicker({
			suggestedName: filename,
			types: [
				{
					accept: { "multipart/form-data": [`.${extension}`] },
				},
			],
		});
		const writable = await handle.createWritable();
		await writable.write(blob);
		await writable.close();
	
		return handle;

	} catch (err: any) {
		if (err.code === 20) return; // Dialog closed
	
		if (err.code === 18) { // User interaction time expired
			return downloadBlobFile(blob, filename);
		}
	
		throw err;
	}
};

/**
 * Fetch and save a file. Optionally, a Response object resulting from a previous fetch call
 * can be provided instead of a URL. 
 *
 * @param urlOrResponse URL to fetch from, or a Response object resulting from a previous fetch call.
 * @param filename
 * @param token If provided a token, use that token in the Authorization header of the fetch request.
 */
export const fetchFileWithToken = async (urlOrResponse: string | Response, filename: string, token: string|null = null, finallyCb = () => {}, isSaveAs = false) => {
	return (typeof urlOrResponse === "string" ? fetch(urlOrResponse, {
		...(token ? { headers: { Authorization: token } } : {}),
	}) : Promise.resolve(urlOrResponse))
		.then((res) => res.blob())
		.then((blob) => {
			isSaveAs ? downloadBlobFileSaveAs(blob, filename) : downloadBlobFile(blob, filename);
		}).catch((err) => {
			throw new Error(err.message);
		})
		.finally(() => {
			finallyCb();
		});
};
