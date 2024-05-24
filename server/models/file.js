/**
 * A "file" record stores informations about file attachments
 */
kiss.app.defineModel({
    id: "file",
    splitBy: "account",
    
    name: "File",
    namePlural: "Files",
    icon: "fas fa-file",
    color: "#00aaee",

    items: [
        {
            id: "accountId",
            dataType: String
        },
        {
            id: "userId",
            dataType: String
        },
        {
            id: "type", // local, amazon_s3
            dataType: String
        },
        {
            id: "path",
            dataType: String
        },
        {
            id: "downloadPath",
            dataType: String
        },
        {
            id: "name",
            dataType: String
        },
        {
            id: "size",
            dataType: Boolean
        },
        {
            id: "fieldname",
            dataType: String
        },
        {
            id: "originalname",
            dataType: String
        },
        {
            id: "encoding",
            dataType: String
        },
        {
            id: "mimeType",
            dataType: String
        },
	    {
			id: 'accessReaders',
		    dataType: Array
	    },
        {
            id: "destination",
            dataType: String
        }
    ]    
});