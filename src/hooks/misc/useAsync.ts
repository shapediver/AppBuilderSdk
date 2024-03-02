import { useCallback, useEffect, useState } from "react";

/**
 * The useAsync hook takes in a callback function that performs the asynchronous operation and an 
 * optional array of dependencies. It returns an object with three properties: loading, error, and value. 
 * The loading property indicates whether the operation is currently in progress, while the error 
 * property holds any error messages encountered during the process. 
 * Finally, the value property contains the resolved value of the asynchronous operation.
 * 
 * @see https://github.com/sergeyleschev/react-custom-hooks
 * 
 * @param callback 
 * @param dependencies 
 * @returns 
 */
export default function useAsync<T>(callback: () => Promise<T>, dependencies: React.DependencyList = []) {

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | undefined>();
	const [value, setValue] = useState<T | undefined>();

	const callbackMemoized = useCallback(() => {
		setLoading(true);
		setError(undefined);
		setValue(undefined);
		callback()
			.then(setValue)
			.catch(setError)
			.finally(() => setLoading(false));

	}, dependencies);

	useEffect(() => {
		callbackMemoized();
	}, [callbackMemoized]);

	return { loading, error, value };
}