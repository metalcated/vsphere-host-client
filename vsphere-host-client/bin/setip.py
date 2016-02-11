import ftplib, socket, fcntl, struct

HTML_FILE = "/opt/vsphere-host-client/webapps/ROOT/index.html"

HTML_PAGE = """<html>

<head>
<meta http-equiv="refresh" content="0;URL=http://%(addr)s:8080/host-client">
</head>

<body>
</body>

</html>"""

def create_redirection_page(ip=None):
    '''Creates and returns a string representation of an html page using the HTML_PAGE variable.'''
    if (ip):
        return HTML_PAGE % {'addr': ip}
    else:
        ip = get_my_ip('eno16777736')
        return HTML_PAGE % {'addr': ip}

def get_my_ip(ifname):
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    return socket.inet_ntoa(fcntl.ioctl(
        s.fileno(),
        0x8915,  # SIOCGIFADDR
        struct.pack('256s', ifname[:15])
    )[20:24])

if __name__ == "__main__":
    # First, we create the web page string.
    dynamic_redirection = create_redirection_page()
    # Then, we write it to a file.
    f = open(HTML_FILE, 'wb')
    f.write(dynamic_redirection)
    f.close()
