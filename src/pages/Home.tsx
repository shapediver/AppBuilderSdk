import { NavLink } from "react-router-dom";

function Home() {
  return (
    <>
      <h1>Example Pages</h1>
      <NavLink to="/view">View</NavLink>
      <br></br>
      <NavLink to="/modelSelect">Model Select</NavLink>
    </>
  );
}

export default Home;