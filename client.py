import socket

# Create a socket, choose TCP protocol
client = socket.socket(family = socket.AF_INET, type = socket.SOCK_STREAM)
# Connect to server
client.connect(('10.250.79.90', 8080))
# Communicate
while True:
    message = input('Message to be sent: ').strip()

    if len(message) == 0:     # empty line detected, terminate sender
        break

    client.send(message.encode('utf-8'))   # Sent as bytes, data needs encoding
    echo = client.recv(1024)    # Receive echo from server
    print(echo.decode('utf-8'))
# Close the socket
client.close()