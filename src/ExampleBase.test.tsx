/**
 * @jest-environment jsdom
 */
import {render, screen} from "@testing-library/react";
import {MantineProvider} from "@mantine/core";
import {HashRouter} from "react-router-dom";
import HomePage from "~/pages/HomePage";

test("renders home page heading", () => {
	render(
		<MantineProvider>
			<HashRouter>
				<HomePage />
			</HashRouter>
		</MantineProvider>,
	);
	expect(screen.getByRole("heading", {level: 1})).toBeInTheDocument();
});
