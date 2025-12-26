const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nameOremail = document.getElementById("identifier").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!nameOremail || !password) {
    alert("Please fill all fields");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameOremail, password })
    });

    const result = await res.json();

    if (res.ok) {
      alert("Login successful!");
      // Stocke le token pour les prochaines requêtes
      localStorage.setItem("token", result.token);
      localStorage.setItem("userName", result.user.name);

      // Redirige vers dashboard ou page principale
      window.location.href = "../app/app.html";
    } else {
      alert(result.message); // Affiche l'erreur du backend
    }

  } catch (err) {
    console.error("Error during login:", err);
    alert("Server error. Try again later.");
  }
});

