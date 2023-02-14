import { Container } from "@mantine/core";

/**
 * 404 - Page
 * 
 * @returns 
 */
export default function NoMatchPage() {
    return (
        <Container style={{ paddingTop: "3rem" }} size="lg" px="lg">
            <h1>404 - PAGE NOT FOUND</h1>
        </Container>
    );
}