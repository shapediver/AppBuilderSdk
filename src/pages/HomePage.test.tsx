/**
 * @jest-environment jsdom
 */
import {expect, test} from "@jest/globals";
import {MantineProvider} from "@mantine/core";
import "@testing-library/jest-dom";
import {render, screen} from "@testing-library/react";
import {HashRouter} from "react-router-dom";
import HomePage from "./HomePage";

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
