async function test() {
  const res = await fetch("http://localhost:5000/api/exams/generate-from-examset", {
    method: "POST"
  });
  const data = await res.text();
  console.log("Status:", res.status);
  console.log("Body:", data);
}
test();
