import socket

# Create a socket, choose TCP protocol
server = socket.socket(family = socket.AF_INET, type = socket.SOCK_STREAM)
# Bind socket to IP address and port number
server.bind(('10.250.79.90', 8080))    # 回环地址，仅限于当前计算机
# Set the socket for listening, allowing for 5 request
server.listen(5)
while True:
    # Accept a connection
    conn, address = server.accept()
    # print client's address
    print("Client's address: " + str(address))
    # Communicate
    while True:
        data = conn.recv(1024)   # 1024 stands for number of receiving bytes

        if len(data) == 0:   # client has closed connection
            print("Client has closed connection, back to listening...")
            break

        conn.send(('Echoed from receiver: '+data.decode('utf-8')).encode('utf-8'))   # Echo from server
    # End communication, i.e., close connection with client
    conn.close()
# Close the socket
server.close()

