import { Image, Container, Card, Group, Text, Button, Paper } from "@mantine/core";
import { Link } from "react-router-dom";

function Home() {
  return (
    <>
      <Container style={{ paddingTop: "3rem" }} size="lg" px="lg">
        <h1>ShapeDiver CreateReactApp Example</h1>

        <Card shadow="sm" p="lg" radius="md">
          <Card.Section>
            <Image
              src="https://viewer.shapediver.com/v3/images/under_construction.png"
              height={160}
              alt="Under Construction"
            />
          </Card.Section>
          <Group position="apart" mt="md" mb="xs">
            <Text size="sm" color="dimmed">
              On this example page we present several use cases that utilize React components for the creation of viewports, sessions, parameters, exports and much more. All these components are provided in the repository and can be customized freely.
            </Text>
          </Group>
        </Card>
        
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "2rem" }}>

          <Card style={{ width: "50%" }} shadow="sm" p="lg" radius="md" withBorder>
            <Card.Section>
              <Image
                src="https://img2.storyblok.com/1280x0/filters:format(webp)/f/92524/2048x1481/81a30bd9de/0202.png"
                height={160}
                alt="Under Construction"
              />
            </Card.Section>
            <Group position="apart" mt="md" mb="xs">
              <Text weight={500}>View Page</Text>
            </Group>

            <Text size="sm" color="dimmed">
              The example for the view page loads a model and creates a parameter and export menu. All export and parameter types are separated in different components to make them easily customizable.
            </Text>

            <Button variant="light" color="blue" fullWidth mt="md" radius="md" component={Link} to="/view">
              Get me there!
            </Button>
          </Card>

          <div style={{ width: "1rem" }}></div>

          <Card style={{ width: "50%" }} shadow="sm" p="lg" radius="md" withBorder>
            <Card.Section>
              <Image
                src="https://img2.storyblok.com/1280x0/filters:format(webp)/f/92524/2048x1481/81a30bd9de/0202.png"
                height={160}
                alt="Under Construction"
              />
            </Card.Section>
            <Group position="apart" mt="md" mb="xs">
              <Text weight={500}>Model Select Page</Text>
            </Group>

            <Text size="sm" color="dimmed">
              The example for the model select page loads a viewport in which multiple sessions can be loaded at once. In this example, the settings of the model which is first selected in the list are used in the viewport.
            </Text>

            <Button variant="light" color="blue" fullWidth mt="md" radius="md" component={Link} to="/modelSelect">
              Get me there!
            </Button>
          </Card>
        </div>
      </Container>
    </>
  );
}

export default Home;