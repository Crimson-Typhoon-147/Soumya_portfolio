var TxtType = function(el, toRotate, period) {
    this.toRotate = toRotate;
    this.el = el;
    this.loopNum = 0;
    this.period = parseInt(period, 10) || 2000;
    this.txt = '';
    this.tick();
    this.isDeleting = false;
};

TxtType.prototype.tick = function() {
    var i = this.loopNum % this.toRotate.length;
    var fullTxt = this.toRotate[i];

    if (this.isDeleting) {
    this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
    this.txt = fullTxt.substring(0, this.txt.length + 1);
    }

    this.el.innerHTML = '<span class="wrap glitch-text" data-text="' + this.txt + '">'+this.txt+'</span>';

    var that = this;
    var delta = 200 - Math.random() * 100;

    if (this.isDeleting) { delta /= 2; }

    if (!this.isDeleting && this.txt === fullTxt) {
    delta = this.period;
    this.isDeleting = true;
    } else if (this.isDeleting && this.txt === '') {
    this.isDeleting = false;
    this.loopNum++;
    delta = 500;
    }

    setTimeout(function() {
    that.tick();
    }, delta);
};

window.onload = function() {
    var elements = document.getElementsByClassName('typewrite');
    for (var i=0; i<elements.length; i++) {
        var toRotate = elements[i].getAttribute('data-type');
        var period = elements[i].getAttribute('data-period');
        if (toRotate) {
          new TxtType(elements[i], JSON.parse(toRotate), period);
        }
    }
    
    // INJECT CSS
    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".typewrite > .wrap { border-right: 0.08em solid #00ff41}";
    document.body.appendChild(css);
    
    // Add glitch effect to headings
    addGlitchEffect();
    
    // Initialize Matrix rain effect
    initMatrixRain();
    
    // Add terminal command input functionality
    initTerminalInput();
};

///------tablinks----/////
var tablinks = document.getElementsByClassName("tab-links");
var tabcontents = document.getElementsByClassName("tab-contents");

function opentab(tabname){
    for(tablink of tablinks){
        tablink.classList.remove("active-link")
    }
    for(tabcontent of tabcontents){
        tabcontent.classList.remove("active-tab")
    }
    event.currentTarget.classList.add("active-link");
    document.getElementById(tabname).classList.add("active-tab");
}


var sidemenu = document.getElementById("sidemenu");

function openmenu(){
    sidemenu.style.right="0";
}

function closemenu(){
    sidemenu.style.right="-200px";
}

//----------google sheet--------

const scriptURL = 'https://script.google.com/macros/s/AKfycbyqI3QvVkvVPV9mXmwxM475QwAEEphy5TRJRsfBdWzzfUMX2ONm83fHRz-8c-t8jvdW/exec'
const form = document.forms['submit-to-google-sheet']

form.addEventListener('submit', e => {
    e.preventDefault();
    
    // Show loading message
    document.querySelector('.alert').innerHTML = "Sending message...";
    document.querySelector('.alert').style.display = 'block';
    
    fetch(scriptURL, { method: 'POST', body: new FormData(form)})
      .then(response => {
          console.log('Success!', response);
          
          // Show success message with terminal-style typing effect
          const alertElement = document.querySelector('.alert');
          alertElement.innerHTML = "";
          
          const successMessages = [
            "Message received...",
            "Processing data...",
            "Connection secure...",
            "Message delivered successfully."
          ];
          
          // Type out each message with delay
          let messageIndex = 0;
          let charIndex = 0;
          
          function typeNextMessage() {
            if (messageIndex < successMessages.length) {
              if (charIndex === 0) {
                alertElement.innerHTML += "<div></div>";
              }
              
              const currentDiv = alertElement.querySelectorAll('div')[messageIndex];
              const currentMessage = successMessages[messageIndex];
              
              if (charIndex < currentMessage.length) {
                currentDiv.textContent += currentMessage.charAt(charIndex);
                charIndex++;
                setTimeout(typeNextMessage, 30);
              } else {
                messageIndex++;
                charIndex = 0;
                setTimeout(typeNextMessage, 500);
              }
            } else {
              // Clear form after messages complete
              form.reset();
              
              // Hide alert after delay
              setTimeout(() => {
                alertElement.style.display = 'none';
              }, 2000);
            }
          }
          
          typeNextMessage();
      })
      .catch(error => {
          console.error('Error!', error.message);
          document.querySelector('.alert').innerHTML = "Error sending message. Please try again.";
          
          // Hide alert after delay
          setTimeout(() => {
            document.querySelector('.alert').style.display = 'none';
          }, 3000);
      });
  });
// Function to add glitch effect to headings
function addGlitchEffect() {
    // Add glitch effect to sub-titles
    const subTitles = document.querySelectorAll('.sub-title');
    subTitles.forEach(title => {
        title.classList.add('glitch-text');
        title.setAttribute('data-text', title.textContent);
    });
    
    // Add glitch effect to project titles
    const projectTitles = document.querySelectorAll('.projects-list div h2');
    projectTitles.forEach(title => {
        title.classList.add('glitch-text');
        title.setAttribute('data-text', title.textContent);
    });
}

// Matrix rain effect
function initMatrixRain() {
    // Create canvas element
    const matrixRain = document.createElement('div');
    matrixRain.className = 'matrix-rain';
    const canvas = document.createElement('canvas');
    matrixRain.appendChild(canvas);
    document.body.appendChild(matrixRain);
    
    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Get canvas context
    const ctx = canvas.getContext('2d');
    
    
    // Font size and columns
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    
    // Array to track the y position of each drop
    const drops = [];
    for (let i = 0; i < columns; i++) {
        drops[i] = 1;
    }
    
    // Draw the matrix rain
    function drawMatrixRain() {
        // Set semi-transparent black background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set text color and font
        ctx.fillStyle = '#00ff41';
        ctx.font = fontSize + 'px monospace';
        
        // Draw characters
        for (let i = 0; i < drops.length; i++) {
            // Random character
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            
            // Draw the character
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            
            // Reset drop position if it's at the bottom or randomly
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            
            // Move the drop down
            drops[i]++;
        }
    }
    
    // Set interval to animate the rain
    setInterval(drawMatrixRain, 50);
    
    // Resize canvas when window is resized
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Terminal command input functionality
function initTerminalInput() {
    // Create terminal input element
    const terminalInput = document.createElement('div');
    terminalInput.className = 'terminal-input';
    terminalInput.innerHTML = '<input type="text" placeholder="Type a command..." id="terminal-command-input">';
    
    // Add terminal input to header
    const headerText = document.querySelector('.header-text');
    headerText.appendChild(terminalInput);
    
    // Create terminal output element
    const terminalOutput = document.createElement('div');
    terminalOutput.className = 'terminal-window';
    terminalOutput.innerHTML = `
        <div class="terminal-header">
            <div class="terminal-button terminal-button-red"></div>
            <div class="terminal-button terminal-button-yellow"></div>
            <div class="terminal-button terminal-button-green"></div>
            <div class="terminal-title">terminal -- user@ethicalhacker:~</div>
        </div>
        <div class="terminal-content" id="terminal-output">
            <p><span class="terminal-prompt">$</span> System initialized</p>
            <p><span class="terminal-prompt">$</span> Type 'help' for available commands</p>
        </div>
    `;
    
    // Add terminal output below terminal input
    headerText.appendChild(terminalOutput);
    
    // Handle terminal input
    const commandInput = document.getElementById('terminal-command-input');
    const output = document.getElementById('terminal-output');
    
    commandInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const command = this.value.trim().toLowerCase();
            const response = processCommand(command);
            
            // Add command to output
            output.innerHTML += `<p><span class="terminal-prompt">$</span> ${command}</p>`;
            
            // Add response to output
            if (response) {
                output.innerHTML += `<p>${response}</p>`;
            }
            
            // Clear input
            this.value = '';
            
            // Scroll to bottom of output
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }
    });
    
    // Process terminal commands
    function processCommand(command) {
        switch(command) {
            case 'help':
                return `Available commands:<br>
                        - about: Display information about me<br>
                        - skills: List my technical skills<br>
                        - projects: View my projects<br>
                        - contact: How to reach me<br>
                        - clear: Clear the terminal`;
            case 'about':
                return `I am an undergraduate pursuing B.Tech in Computer Science and Engineering with a focus on Cybersecurity. Passionate about ethical hacking and penetration testing.`;
            case 'skills':
                return `Technical skills:<br>
                        - Python<br>
                        - Network Security<br>
                        - Web Application Security<br>
                        - Vulnerability Assessment<br>
                        - Tools: Wireshark, Splunk, Burp Suite, Nmap`;
            case 'projects':
                return `Notable projects:<br>
                        - CyberPandas: AI-powered cybersecurity chatbot<br>
                        - Network Scanner: Python tool for network scanning<br>
                        - Wifi-Hacking Tool: Wireless network auditing tool`;
            case 'contact':
                return `Email: soumyashree.sahoo.147@gmail.com<br>
                        Phone: +91 7064584441<br>
                        GitHub: github.com/soumyass147`;
            case 'clear':
                output.innerHTML = '';
                return null;
            default:
                return `Command not found: ${command}. Type 'help' for available commands.`;
        }
    }
}
//loader
window.addEventListener("load", () => {
    const loader = document.getElementById("cyber-loader");
    if (loader) {
      setTimeout(() => {
        loader.style.display = "none";
      }, 3000); // Loader disappears after 3 seconds
    }
  });
  