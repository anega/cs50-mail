document.addEventListener('DOMContentLoaded', function () {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', () => compose_email());
    document.querySelector('#compose-form').addEventListener('submit', (event) => sendEmail(event));

    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email(emailData) {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-details').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

    if (emailData !== undefined && Object.keys(emailData).length !== 0) {
        document.getElementById('compose-recipients').value = emailData.sender
        if (emailData.subject.substring(0, 3) === 'Re:') {
            document.getElementById('compose-subject').value = emailData.subject
        } else {
            document.getElementById('compose-subject').value = `Re: ${emailData.subject}`
        }
        document.getElementById('compose-body').value = `On ${emailData.timestamp} ${emailData.sender} wrote:\n${emailData.body}`
    }
}

function sendEmail(event) {
    event.preventDefault()
    const recipients = document.getElementById('compose-recipients').value
    const subject = document.getElementById('compose-subject').value
    const body = document.getElementById('compose-body').value
    const form = document.querySelector('#compose-form');

    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body
        })
    })
        .then(response => {
            if (response.ok) {
                return response.json()
            }
            response.json().then(result => {
                result.error
                const error = new Error(result.error)
                error.name = ''
                throw error
            })

        })
        .then(() => {
            form.reset()
            load_mailbox('sent')
        })
        .catch(error => {
            const errorText = document.createTextNode(error)
            const pTag = document.createElement('p')
            pTag.classList.add('error-msg')
            pTag.appendChild(errorText)
            form.prepend(pTag)
        })
}

function emailRowView(emailData) {
    const email = document.createElement('div')
    email.setAttribute('data-id', emailData.id)
    email.classList.add('email-row')
    if (!emailData.read) {
        email.classList.add('email-unread')
    }

    const emailFrom = document.createElement('span')
    emailFrom.classList.add('email-from')
    const emailFromText = document.createTextNode(emailData.sender)
    emailFrom.appendChild(emailFromText)

    const emailSubject = document.createElement('span')
    emailSubject.classList.add('email-subject')
    const emailSubjectText = document.createTextNode(emailData.subject)
    emailSubject.appendChild(emailSubjectText)

    const emailCreatedAt = document.createElement('span')
    emailCreatedAt.classList.add('email-date')
    const emailCreatedAtText = document.createTextNode(emailData.timestamp)
    emailCreatedAt.appendChild(emailCreatedAtText)

    email.appendChild(emailFrom)
    email.appendChild(emailSubject)
    email.appendChild(emailCreatedAt)

    email.addEventListener('click', function () {
        load_email(this.dataset.id)
    })

    document.querySelector('#emails-view').append(email)
}

function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#email-details').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emailsList => {
            if (emailsList.length) {
                emailsList.forEach(emailRowView)
            } else {
                document.querySelector('#emails-view').innerHTML += '<p>There are no emails yet.</p>'
            }
        })
}

function load_email(email_id) {
    // Show email details and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    const emailDetailsView = document.querySelector('#email-details')
    emailDetailsView.innerHTML = '';
    emailDetailsView.style.display = 'block';
    const currentUserEmail = document.querySelector('#current-user-email').innerHTML

    fetch(`/emails/${email_id}`)
        .then(response => response.json())
        .then(email => {
            if (email.archived) {
                emailDetailsView.innerHTML = '<p class="btn btn-sm btn-primary" id="archive-btn" data-archived="false">Unarchive the email</p>'
            }
            if (!email.archived && currentUserEmail !== email.sender) {
                emailDetailsView.innerHTML = '<p class="btn btn-sm btn-primary" id="archive-btn" data-archived="true">Archive the email</p>'
            }
            emailDetailsView.innerHTML +=
                `<p id="reply-btn" class="btn btn-sm btn-primary">Reply</p>
                <h3 class="d-flex justify-content-between">${email.subject} <span class="email-time">${email.timestamp}</span></h3>
                <p>From: ${email.sender}</p>
                <p>To: ${email.recipients}</p>
                <p>${email.body}</p>`;

            const archiveBtn = document.querySelector('#archive-btn')
            if (archiveBtn) {
                archiveBtn.addEventListener('click', (event) => {
                    let isArchive = event.target.dataset.archived === 'true'
                    fetch(`/emails/${email_id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            archived: isArchive
                        })
                    })
                        .then(() => {
                            load_mailbox('inbox')
                        })
                })
            }

            document.querySelector('#reply-btn').addEventListener('click', () => {
                compose_email(email)
            })
        })

    fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    })
}
