const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = form.querySelector('input[type="text"]').value.trim();
  const email = form.querySelector('input[type="email"]').value.trim();
  const password = form.querySelectorAll('input[type="password"]')[0].value.trim();
  const confirmPassword = form.querySelectorAll('input[type="password"]')[1].value.trim();

  if (!name || !email || !password || !confirmPassword) {
    alert("Please fill all fields");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, confirmPassword })
    });

    const result = await res.json();

    if (res.ok) {
      alert("Account created successfully!");
      // stocker le token si tu veux garder l'utilisateur connecté
      localStorage.setItem("token", result.token);
      window.location.href = "../login/login.html"; // redirection vers login
    } else {
      alert(result.message); // affiche le message d'erreur du backend
    }

  } catch (err) {
    console.error("Error during signup:", err);
    alert("Server error. Try again later.");
  }
});

