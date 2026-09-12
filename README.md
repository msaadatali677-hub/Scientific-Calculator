# 🧮 CodeWithSaadat — Scientific Calculator & Unit Converter

A **production-quality, responsive, dependency-free Scientific Calculator & Unit Converter** built with pure **HTML5, CSS3, and Vanilla JavaScript**.

No frameworks. No build tools. No dependencies.
Just download the project, open `index.html`, and start using it. 🚀

---

## ✨ Project Overview

**CodeWithSaadat Scientific Calculator & Unit Converter** is an all-in-one web utility designed for students, developers, and everyday users.

It combines a powerful scientific calculator with multiple unit-conversion tools, number-system utilities, currency conversion, calculation history, memory functions, themes, and responsive design.

The project focuses on:

* ⚡ Fast performance
* 📱 Mobile responsiveness
* 🎨 Modern glassmorphism UI
* 🔐 Safe expression parsing without `eval()`
* 💾 Local calculation history
* 🌐 Live currency exchange rates
* 🧩 Zero external dependencies

---

## Live Demo
https://scientific-calculator-by-saadat.netlify.app/

## 🚀 Features

### 🧮 Scientific Calculator

Supports a wide range of mathematical operations:

* Basic arithmetic
* Addition, subtraction, multiplication and division
* Parentheses
* Powers
* Square roots
* Cube roots
* Factorial
* Percentage
* Modulo
* Logarithm
* Natural logarithm
* Exponential functions
* Trigonometric functions
* Inverse trigonometric functions
* Hyperbolic functions
* Constants:

  * π (Pi)
  * e (Euler's number)
  * φ (Golden Ratio)
* DEG / RAD / GRAD modes
* Scientific notation
* Operator precedence
* Right-associative exponentiation

---

## 🧠 Safe Calculator Engine

The calculator does **not** use JavaScript's `eval()` function.

Instead, it uses a custom mathematical parser consisting of:

```text
Tokenizer
   ↓
Recursive-Descent Parser
   ↓
Expression Evaluator
   ↓
Result
```

The main calculator engine uses:

* `tokenize()`
* `evaluateExpression()`

This provides predictable mathematical precedence and avoids directly executing user-entered JavaScript code.

Supported precedence includes:

```text
!
%
^
*
/
mod
+
-
```

Exponentiation (`^`) is right-associative.

---

## 🧠 Memory Functions

The calculator includes standard memory controls:

| Button | Function             |
| ------ | -------------------- |
| MC     | Memory Clear         |
| MR     | Memory Recall        |
| M+     | Add to Memory        |
| M-     | Subtract from Memory |
| MS     | Store in Memory      |

---

## 📚 Unit Converter

The application includes multiple conversion categories.

### 📏 Length

Examples:

* Millimeter
* Centimeter
* Meter
* Kilometer
* Inch
* Foot
* Yard
* Mile

### 📐 Area

Examples:

* Square Meter
* Square Kilometer
* Square Foot
* Square Inch
* Acre
* Hectare

### 🧊 Volume

Examples:

* Milliliter
* Liter
* Cubic Meter
* Gallon
* Quart
* Pint
* Cup

### ⚖️ Weight

Examples:

* Milligram
* Gram
* Kilogram
* Ounce
* Pound
* Ton

### 🌡️ Temperature

Supports:

* Celsius
* Fahrenheit
* Kelvin

### 🚗 Speed

Supports:

* m/s
* km/h
* mph
* knot

### 🧯 Pressure

Supports:

* Pascal
* Kilopascal
* Bar
* PSI
* Atmosphere

### ⚡ Power

Supports:

* Watt
* Kilowatt
* Megawatt
* Horsepower

---

# 🔢 Number System Converter

Convert numbers between:

* Binary
* Decimal
* Octal
* Hexadecimal

Example:

```text
Decimal:     255
Binary:      11111111
Octal:       377
Hexadecimal: FF
```

The project can also provide **binary arithmetic utilities** for working with binary values.

---

# 💱 Currency Converter

The currency converter is designed to use **live exchange-rate data** rather than hard-coded exchange rates.

By default, it can connect to:

**ExchangeRate-API — Open Access Endpoint**

The application can retrieve the latest available rates and display the rate date in the interface.

> Currency exchange rates are provided by an external API and may change over time.

### API Configuration

Currency settings are controlled through the `CURRENCY_API_CONFIG` object in `script.js`.

Example:

```js
const CURRENCY_API_CONFIG = {
  enabled: true,
  apiUrl: 'https://your-provider.example.com/latest',
  apiKey: 'YOUR_KEY'
};
```

The `fetchRates()` function should return data in this structure:

```js
{
  rates: {
    USD: 1,
    EUR: 0.85,
    GBP: 0.74
  },
  date: '2026-09-11'
}
```

### Important

If you use a currency API that requires an API key, avoid exposing private production credentials in client-side JavaScript.

For a production application, use a backend/proxy layer to protect secret API keys.

---

# 📜 Calculation History

The application includes a calculation-history system.

Features include:

* Automatically save calculations
* View previous calculations
* Reuse previous results
* Clear history
* Persistent history using browser `localStorage`

Example:

```text
25 × 4 = 100
√144 = 12
sin(30) = 0.5
```

---

# ⌨️ Keyboard Shortcuts

The calculator supports keyboard input.

| Key         | Action         |
| ----------- | -------------- |
| `0-9`       | Enter numbers  |
| `+`         | Addition       |
| `-`         | Subtraction    |
| `*`         | Multiplication |
| `/`         | Division       |
| `(` `)`     | Parentheses    |
| `Enter`     | Calculate      |
| `=`         | Calculate      |
| `Backspace` | Delete         |
| `Esc`       | Clear          |

---

# 🎨 UI & Design

The interface uses a modern **dark/light glassmorphism design**.

### Design Features

* 🌙 Dark mode
* ☀️ Light mode
* 🪟 Glassmorphism UI
* 📱 Mobile-first responsive layout
* 💻 Desktop optimized
* ✨ Smooth transitions
* 🔔 Toast notifications
* 📋 Copy-to-clipboard functionality
* 🖥️ Fullscreen calculator mode
* 🎯 Clean navigation
* ♿ User-friendly controls

---

# 📱 Responsive Design

The application is designed to work across:

* 📱 Smartphones
* 📲 Tablets
* 💻 Laptops
* 🖥️ Desktop computers

No separate mobile application is required.

---

# 🗂️ Project Structure

```text
CodeWithSaadat-Scientific-Calculator/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

### `index.html`

Contains the application structure:

* Calculator
* Converter
* History
* About section
* Navigation
* Buttons
* Input fields

### `style.css`

Controls:

* Dark/light themes
* Glassmorphism
* Responsive layout
* Calculator styling
* Converter UI
* Animations
* Mobile layout

### `script.js`

Contains:

* Calculator engine
* Expression tokenizer
* Recursive-descent parser
* Scientific functions
* Memory functions
* Unit converters
* Number-system converter
* Currency API integration
* History management
* LocalStorage
* Theme switching
* Keyboard controls
* Toast notifications
* Clipboard functionality

---

# ▶️ Run Locally

## Option 1 — Open Directly

Simply double-click:

```text
index.html
```

The application will open in your default browser.

---

## Option 2 — Using a Local Server

If you have Node.js installed:

```bash
npx serve .
```

Then open the local address shown in your terminal.

---

## Option 3 — VS Code Live Server

1. Open the project in **VS Code**
2. Install the **Live Server** extension
3. Right-click `index.html`
4. Select **Open with Live Server**

---

# 🌐 Deployment

Because this is a static website, it can be deployed easily on platforms such as:

* GitHub Pages
* Netlify
* Vercel
* Cloudflare Pages
* Any static hosting provider

No build command is required.

---

# 🔐 Security

This project intentionally avoids:

```js
eval()
```

Instead, mathematical expressions are processed through a custom tokenizer and recursive-descent parser.

This provides better control over what the calculator can interpret.

However, when connecting external APIs, always consider:

* API key security
* HTTPS
* CORS
* Rate limits
* API availability
* Input validation

---

# 💾 Browser Storage

The application uses browser `localStorage` for client-side persistence.

Potentially stored information includes:

* Calculation history
* User preferences
* Calculator memory
* Theme settings

Data stored in `localStorage` remains in the user's browser unless cleared.

---

# 🧪 Example Calculations

### Basic

```text
25 + 15
```

Result:

```text
40
```

### Power

```text
2^10
```

Result:

```text
1024
```

### Square Root

```text
√144
```

Result:

```text
12
```

### Factorial

```text
5!
```

Result:

```text
120
```

### Trigonometry

In DEG mode:

```text
sin(30)
```

Result:

```text
0.5
```

---

# 🎯 Use Cases

This project can be useful for:

* 👨‍🎓 Students
* 👩‍💻 Developers
* 🧮 Mathematics practice
* 📐 Engineering calculations
* 🏫 Educational projects
* 💼 Portfolio projects
* 🌐 Web development practice
* 📱 Responsive web-app demonstrations

---

# 🛠️ Technologies Used

| Technology   | Purpose                   |
| ------------ | ------------------------- |
| HTML5        | Application structure     |
| CSS3         | Styling and responsive UI |
| JavaScript   | Application logic         |
| LocalStorage | Persistent browser data   |
| REST API     | Currency exchange rates   |

### No Frameworks

This project does **not** require:

* React
* Vue
* Angular
* Bootstrap
* Tailwind
* jQuery
* Node.js runtime
* Build tools

It runs directly in the browser.

---

# 📈 Future Roadmap

Possible future improvements:

* [ ] More scientific functions
* [ ] More unit categories
* [ ] More world currencies
* [ ] Offline/PWA support
* [ ] Installable mobile web app
* [ ] Advanced statistics calculator
* [ ] Equation solver
* [ ] Matrix calculator
* [ ] Percentage calculator
* [ ] Date & time calculator
* [ ] Finance calculator
* [ ] Loan/EMI calculator
* [ ] Compound-interest calculator
* [ ] Graph plotting
* [ ] Calculation export
* [ ] PDF calculation reports
* [ ] Multi-language support
* [ ] Custom calculator themes

---

# 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

### Steps

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature/new-feature
```

3. Make your changes
4. Commit your changes

```bash
git add .
git commit -m "Add new feature"
```

5. Push the branch

```bash
git push origin feature/new-feature
```

6. Open a Pull Request

---

# ⭐ Support the Project

If you find this project useful:

⭐ Give the repository a star
🍴 Fork the project
🐛 Report bugs
💡 Suggest new features
📢 Share it with other developers

---

# 👨‍💻 Author

## CodeWithSaadat

**Saadat Ali**

Frontend Developer | Web Developer | AI Learner
BS Computer Science Student

### Connect With Me

* 🌐 Portfolio: https://codewithsaadat.netlify.app/
* 💻 GitHub: https://github.com/msaadatali677-hub
* 💼 LinkedIn: https://linkedin.com/in/saadat-ali-3021ab3a5
* 📸 Instagram: https://instagram.com/code_with_saadat

---

# 📄 License

This project is available for learning and personal use.

If you reuse or modify the project, giving credit to **CodeWithSaadat** is appreciated.

---

## 🧮 CodeWithSaadat

> **Calculate. Convert. Learn. Build.**

Made with ❤️ using **HTML, CSS & JavaScript**.

© 2026 CodeWithSaadat — Scientific Calculator & Unit Converter
