import express from "express";
import cors from "cors";

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

let ideas = [];

function generateId() {
  return Math.random().toString(36).slice(2, 8);
}

// Check whether the backend is running
app.get("/", (req, res) => {
  res.send("Ideas backend is running!");
});

// Get every idea
app.get("/ideas", (req, res) => {
  res.send({ ideas_list: ideas });
});

// Get one idea
app.get("/ideas/:id", (req, res) => {
  const idea = ideas.find((idea) => idea.id === req.params.id);

  if (idea === undefined) {
    return res.status(404).send("Idea not found.");
  }

  res.send(idea);
});

// Add an idea
app.post("/ideas", (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).send("Title and description are required.");
  }

  const newIdea = {
    id: generateId(),
    title,
    description,
  };

  ideas.push(newIdea);
  res.status(201).send(newIdea);
});

// Edit an idea
app.put("/ideas/:id", (req, res) => {
  const idea = ideas.find((idea) => idea.id === req.params.id);

  if (idea === undefined) {
    return res.status(404).send("Idea not found.");
  }

  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).send("Title and description are required.");
  }

  idea.title = title;
  idea.description = description;

  res.send(idea);
});

// Delete an idea
app.delete("/ideas/:id", (req, res) => {
  const index = ideas.findIndex((idea) => idea.id === req.params.id);

  if (index === -1) {
    return res.status(404).send("Idea not found.");
  }

  ideas.splice(index, 1);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Ideas backend running at http://localhost:${port}`);
});