export function allowCompany(allowedCNs = []) {
    return (req, res, next) => {
        const verified = req.headers['x-client-verify'];
        const subject = req.headers['x-client-subject'];

        if (verified !== 'SUCCESS') {
            return res.status(401).json({ error: 'Client certificate not verified' });
        };

        // Extract CN from subject string
        // Example subject: "CN=screen-supplier-api.projects.bbdgrad.com,OU=screen-supplier,O=Miniconomy,L=Johannesburg,ST=Gauteng,C=ZA"
        const match = subject.match(/CN=([^,]+)/);
        if (!match) {
            return res.status(400).json({ error: 'Invalid client certificate subject format' });
        };

        const clientCN = match[1];

        if (!allowedCNs.includes(clientCN)) {
            return res.status(403).json({ error: `Access denied: CN "${clientCN}" not allowed` });
        };

        next();
    };
}