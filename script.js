const fileInput = document.getElementById('fileInput');
const extractedTextDiv = document.getElementById('extractedText');
const landlordEmail = document.getElementById('landlordEmail');
const issueInput = document.getElementById('issue');
const urgencySelect = document.getElementById('urgency');
const issuesDiv = document.getElementById('issues');
const totalIssues = document.getElementById('totalIssues');
const resolvedIssues = document.getElementById('resolvedIssues');
const toggleLeaseButton = document.getElementById('toggleLease');
const toggleExtractedTextButton = document.getElementById('toggleExtractedText');

// Load stored issues and lease text
function loadStoredData() {
    loadIssues();
    loadLease();
}

// Extract text from uploaded image
function extractText() {
    const file = fileInput.files[0];
    if (!file) {
        alert('Please upload a file.');
        return;
    }

    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function() {
        Tesseract.recognize(
            reader.result,
            'eng',
            { logger: m => console.log(m) }
        ).then(({ data: { text } }) => {
            extractedTextDiv.innerHTML = `<pre>${text}</pre>`;
            extractedTextDiv.style.display = "block"; // Show the extracted text
            toggleExtractedTextButton.style.display = "block"; // Show the toggle button
        }).catch(err => {
            console.error(err);
            alert('Error processing file: ' + err.message);
        });
    };
    reader.readAsDataURL(file);
}

// Search for a term in the extracted text
function searchLeaseText() {
    const searchTerm = prompt('Enter a term to search:');
    if (!searchTerm) return;

    const text = extractedTextDiv.innerText;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const highlightedText = text.replace(regex, '<mark>$1</mark>');
    extractedTextDiv.innerHTML = `<pre>${highlightedText}</pre>`;
}

// Save the lease text to local storage
function saveLease() {
    const text = extractedTextDiv.innerText;
    localStorage.setItem('leaseText', text);
    alert('Lease agreement saved!');
}

// Load the lease text from local storage
function loadLease() {
    const text = localStorage.getItem('leaseText');
    if (text) {
        extractedTextDiv.innerHTML = `<pre>${text}</pre>`;
        extractedTextDiv.style.display = "block"; // Ensure it displays
        toggleExtractedTextButton.style.display = "block"; // Show the toggle button
    } else {
        alert('No lease agreement saved.');
    }
}

// Toggle the display of the lease content
toggleLeaseButton.addEventListener('click', () => {
    const leaseContent = document.getElementById('leaseContent');
    leaseContent.style.display = leaseContent.style.display === "none" ? "block" : "none";
    toggleLeaseButton.textContent = leaseContent.style.display === "block" ? "▲ Collapse Lease" : "▼ Expand Lease";
});

// Toggle the display of the extracted lease text
toggleExtractedTextButton.addEventListener('click', () => {
    extractedTextDiv.style.display = extractedTextDiv.style.display === "none" ? "block" : "none";
    toggleExtractedTextButton.textContent = extractedTextDiv.style.display === "block" ? "▲ Hide Extracted Text" : "▼ Show Extracted Text";
});

// Add maintenance issue
document.getElementById('addIssueBtn').addEventListener('click', () => {
    const email = landlordEmail.value;
    const issueText = issueInput.value;
    const urgencyValue = urgencySelect.value;
    const timestamp = new Date().toLocaleString();

    if (!email || !issueText) {
        alert('Please fill out all fields.');
        return;
    }

    const issue = {
        email,
        issueText,
        urgency: urgencyValue,
        timestamp,
        resolved: false
    };

    addIssueToDOM(issue);
    saveIssueToLocalStorage(issue);
    updateIssueCount(); // Update the count after adding a new issue
});

// Display an issue in the DOM
function addIssueToDOM(issue) {
    const issueCard = document.createElement('div');
    issueCard.className = 'issue-card';

    issueCard.innerHTML = `
        <div class="issue-status" style="border-left: 5px solid ${issue.resolved ? 'green' : 'transparent'};"></div>
        <div class="issue-content">
            <h4>${issue.issueText}</h4>
            <p><strong>Urgency:</strong> ${issue.urgency}</p>
            <p><strong>Date Reported:</strong> ${issue.timestamp}</p>
            <button class="deleteBtn">Delete</button>
            <button class="resolveBtn">${issue.resolved ? 'Unresolve' : 'Resolve'}</button>
            <button class="contactLandlord" onclick="contactLandlord('${issue.issueText}')">Contact Landlord</button>
        </div>
    `;

    issueCard.querySelector('.resolveBtn').addEventListener('click', () => {
        issue.resolved = !issue.resolved;
        const statusDiv = issueCard.querySelector('.issue-status');
        statusDiv.style.borderLeft = issue.resolved ? '5px solid green' : 'transparent';
        issueCard.querySelector('.resolveBtn').textContent = issue.resolved ? 'Unresolve' : 'Resolve';
        saveIssuesToLocalStorage(); // Save all issues including updated resolved status
        updateIssueCount(); // Update the count after resolving
    });

    issueCard.querySelector('.deleteBtn').addEventListener('click', () => {
        issueCard.remove();
        removeIssueFromLocalStorage(issue);
        updateIssueCount(); // Update the count after deleting
    });

    issuesDiv.appendChild(issueCard);
}

// Function to create mailto link
function contactLandlord(issueText) {
    const email = landlordEmail.value;
    const subject = encodeURIComponent(`Maintenance Issue: ${issueText}`);
    const mailtoLink = `mailto:${email}?subject=${subject}`;
    window.location.href = mailtoLink;
}

// Save issue to local storage
function saveIssueToLocalStorage(issue) {
    const issues = JSON.parse(localStorage.getItem('issues')) || [];
    issues.push(issue);
    localStorage.setItem('issues', JSON.stringify(issues));
}

// Load and display issues from local storage
function loadIssues() {
    const issues = JSON.parse(localStorage.getItem('issues')) || [];
    issues.forEach(issue => {
        addIssueToDOM({
            ...issue,
            resolved: issue.resolved // Ensure the resolved status is set correctly
        });
    });
    updateIssueCount(); // Update count after loading issues
}

// Remove issue from local storage
function removeIssueFromLocalStorage(issue) {
    let issues = JSON.parse(localStorage.getItem('issues')) || [];
    issues = issues.filter(i => i.issueText !== issue.issueText);
    localStorage.setItem('issues', JSON.stringify(issues));
}

// Save all issues to local storage
function saveIssuesToLocalStorage() {
    const issues = Array.from(issuesDiv.children).map(issueCard => {
        const issueText = issueCard.querySelector('h4').innerText;
        const urgency = issueCard.querySelector('p:nth-of-type(1) strong').nextSibling.textContent.trim();
        const timestamp = issueCard.querySelector('p:nth-of-type(2) strong').nextSibling.textContent.trim();
        const resolved = issueCard.querySelector('.resolveBtn').textContent === 'Unresolve';
        return { issueText, urgency, timestamp, resolved };
    });
    localStorage.setItem('issues', JSON.stringify(issues));
}

// Update issue count display
function updateIssueCount() {
    const issues = JSON.parse(localStorage.getItem('issues')) || [];
    totalIssues.textContent = issues.length;
    const resolvedCount = issues.filter(issue => issue.resolved).length;
    resolvedIssues.textContent = resolvedCount;
}

// Initialize app
document.addEventListener('DOMContentLoaded', loadStoredData);
