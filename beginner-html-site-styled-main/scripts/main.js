// Get references to the button and heading
let myButton = document.querySelector("button");
let myHeading = document.querySelector("h1");

// Function to set a personalized greeting
function setUserName() {
  const myName = prompt("Please enter your name:");
  if (!myName) {
    setUserName(); // If no name, prompt again
  } else {
    localStorage.setItem("name", myName);
    myHeading.textContent = `Welcome to DENTL, ${myName}!`;
  }
}

// Initialize the greeting when the page loads
if (!localStorage.getItem("name")) {
  setUserName();
} else {
  const storedName = localStorage.getItem("name");
  myHeading.textContent = `Welcome to DENTL, ${storedName}!`;
}

// Allow user to change their stored name
myButton.addEventListener("click", () => {
  setUserName();
});
