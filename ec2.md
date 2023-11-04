nvm node npm git installer
1. https://medium.com/geekculture/how-to-install-node-js-by-nvm-61addf4ab1ba
2. https://medium.com/@rajani103/deploying-nodejs-app-on-aws-ec2-instance-step-by-step-1b00f807cdce

# Installing git with nvm
1. Ensure NVM is sourced :- source ~/.bashrc
2. Use NVM to install Git :- nvm exec npm install -g git
 

# Closing the SSH connection but keeping the server onn.
1. screen -ls :-  https://dev.to/akhileshthite/how-to-keep-ec2-instance-running-after-ssh-is-terminated-45k8


# creating a new subdomain of api.dkacademy.co.in
1. I bought a new domain named dkacademy.co.in from godaddy.
2. Vercel gave me 1 IP address and I linked that IP address with the domain.
3. so now vercel has made a SSL certificate for me for dkacademy.co.in
4. Now for server I have made a new subdomain named api.dkacademy.co.in and linked my elastic IP address of my EC2 instance with the subdomain on godaddy.

# using certbot for making a SSL certificate.
1. Install Certbot: 
  sudo apt-get update
  sudo apt-get install certbot
2. Obtain SSL Certificate and Key:
  sudo apt-get install python3-certbot-nginx
  sudo certbot certonly --nginx
3. Find the Certificate and Key Files:
  Certbot stores the obtained certificates in the /etc/letsencrypt/live directory. You can find the certificate and private key files there. For example:
  Certificate file: /etc/letsencrypt/live/your_domain/fullchain.pem
  Private key file: /etc/letsencrypt/live/your_domain/privkey.pem
4. Update Nginx Configuration:
Update your Nginx configuration to point to the obtained certificate and private key. As mentioned in the previous response, replace the SSL certificate and key paths in your Nginx configuration:
  ssl_certificate /etc/letsencrypt/live/your_domain/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your_domain/privkey.pem;
5. Restart Nginx:
  sudo service nginx restart
