# Orcas 

Orcas is a clone of a ORCA couchapp made originally by Mark Howe.  This repo is for exploration and customization. 

## Requirements

Orca, see http://orca.physics.unc.edu

## Install

<pre><code>
git clone https://mgmarino@github.com/mgmarino/Orcas.git 
cd Orcas
curl -X PUT 'http://localhost:5984/orcas'
couchapp push 

To configure the application display and behavior, modify the files:

    _attachments/index.html
    _attachments/script.js
    
Now view your app at http://localhost:5984/orcas/_design/orcas/index.html 

