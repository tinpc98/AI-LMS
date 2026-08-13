fetch("http://localhost:5000/api/classes")
  .then(r => console.log(r.status))
  .catch(e => console.error(e));
