import React from 'react';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { io } from 'socket.io-client';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import './App.css';

const theme = createTheme();
const boardSize = 16;

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: "",
            oname: "",
            color: "",
            turn: false,
            socket: null,
            // 0 : log in, 1 : home page, 2 : searching, 3 : playing
            phase: 0,
            board: null,
            resultShow: false,
            winOrlose: 0
        };
    }

    shouldComponentUpdate(nextProps,nextState) {
        return (nextState.name !== this.state.name ||
                nextState.phase !== this.state.phase ||
                nextState.board !== this.state.board ||
                nextState.resultShow !== this.state.resultShow ||
                nextState.turn !== this.state.turn);
    }
    
    handleResultClose = () => {
        this.setState({
            resultShow: false,
            phase: 1
        })
    };

    handleEnterGame = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const uname = data.get('uname');
        if (uname === null || uname === undefined || uname === "") {
            alert("no player name input...");
            return;
        }
        var { socket } = this.state;
        if (socket === null) {
            console.log("create socket...");
            socket = io("http://localhost:5000", {
                reconnectionDelay: 1000,
                reconnection: true,
                reconnectionAttemps: 10,
                transports: ['websocket']
            });

            this.setState({socket: socket});

            socket.on("home", (msg)=>{
                // console.log(msg);
                if (msg.error) {
                    alert(uname + " already exists...");
                } else {
                    this.setState({name: msg.name, phase: 1});
                }
            });

            socket.on("play", (msg) => {
                var arr = new Array(boardSize);
                for(var i = 0; i < boardSize; i++){
                    arr[i] = new Array(boardSize).fill(0);
                }
                this.setState({
                    oname : msg.name,
                    color: msg.color,
                    turn: msg.color === "white" ? true : false,
                    phase: 3,
                    board: arr,
                    winOrlose: 0,
                    resultShow: false
                })
            });

            socket.on("turn", (move) => {
                var {color, board} = this.state;
                if ( color === "white" ) {
                    document.getElementById("piece-img-" + move.x + "-" + move.y).src = require("./blackStone.png");
                    board[move.x][move.y] = -1;
                    // set board and turn
                } else {
                    document.getElementById("piece-img-" + move.x + "-" + move.y).src = require("./whiteStone.png");
                    board[move.x][move.y] = 1;
                }
                // setState board and turn
                this.setState({
                    board: board,
                    turn: true
                })
            });

            socket.on("ulose", () => {
                this.setState({
                    resultShow: true,
                    winOrlose: -1
                })
            })

            socket.on("iwin", () => {
                this.setState({
                    resultShow: true,
                    winOrlose: 1
                })
            })
        }
        socket.emit("enter", uname);
    };

    checkResult = (x, y) => {
        const { board, color, socket } = this.state;
        const flag = color === "white" ? 1 : -1;

        var direct_cnt = 1, i, j;
        // -
        for (i = x - 1; i >= 0 && board[i][y] === flag; i--, direct_cnt++);
        for (i = x + 1; i < boardSize && board[i][y] === flag; i++, direct_cnt++);
        if (direct_cnt >= 5) {
            this.setState({
                resultShow: true,
                winOrlose: 1
            })
            socket.emit("iwin");
            return;
        }
        // |
        direct_cnt = 1;
        for (i = y - 1; i >= 0 && board[x][i] === flag; i--, direct_cnt++);
        for (i = y + 1; i < boardSize && board[x][i] === flag; i++, direct_cnt++);
        if (direct_cnt >= 5) {
            this.setState({
                resultShow: true,
                winOrlose: 1
            })
            socket.emit("iwin");
            return;
        }
        // /
        direct_cnt = 1;
        for (i = x + 1, j = y + 1; i < boardSize && j < boardSize && board[i][j] === flag; i++, j++, direct_cnt++);
        for (i = x - 1, j = y - 1; i >= 0 && j >= 0 && board[i][j] === flag; i--, j--, direct_cnt++);
        if (direct_cnt >= 5) {
            this.setState({
                resultShow: true,
                winOrlose: 1
            })
            socket.emit("iwin");
            return;
        }
        // \
        direct_cnt = 1;
        for (i = x - 1, j = y + 1; i >= 0 && j < boardSize && board[i][j] === flag; i--, j++, direct_cnt++);
        for (i = x + 1, j = y - 1; i < boardSize && j >= 0 && board[i][j] === flag; i++, j--, direct_cnt++);
        if (direct_cnt >= 5) {
            this.setState({
                resultShow: true,
                winOrlose: 1
            })
            socket.emit("iwin");
            return;
        }
    }

    wantToPlay = () => {
        var {socket, phase} = this.state;
        if (phase === 2) {
            this.setState({phase: 1});
            socket.emit("cancel");
        } else if ( phase === 1 ) {
            this.setState({phase: 2});
            socket.emit("play");
        }
    }

    tableClick = (i, j) => {
        var { board, turn, color, socket } = this.state;
        if (!turn || board[i][j] !== 0 || color === "") {
            return;
        } else if ( color === "white" ) {
            document.getElementById("piece-img-" + i + "-" + j).src = require("./whiteStone.png");
            board[i][j] = 1;  
        } else {
            document.getElementById("piece-img-" + i + "-" + j).src = require("./blackStone.png");
            board[i][j] = -1;
        }
        socket.emit("move", {x: i, y: j});
        // setState board and turn
        this.setState({
            board: board,
            turn: false
        })
        this.checkResult(i, j);
    }

    render() {
        const {name, oname, phase, board, resultShow, winOrlose, color, turn } = this.state;
        let searchBtnMsg = phase === 2 ? "quit searching" : "search player";
        let winlosemsg = winOrlose === 1 ? "You Win !!!" : "You Lose !!!";
        const colspanm = boardSize / 2;
        const ocolor = color === "white" ? "black" : "white";
        const turnstr = turn ? " *" : "";
        const oturnstr = turn ? "" : " *";

        if (phase === 3) {
            return (
                <div class="center-div">
                    <Dialog
                        open={resultShow}
                        onClose={this.handleResultClose}
                        aria-labelledby="alert-dialog-title"
                        aria-describedby="alert-dialog-description"
                    >
                        <DialogTitle id="alert-dialog-title">
                        {winlosemsg}
                        </DialogTitle>
                        <DialogActions>
                        <Button onClick={this.handleResultClose} autoFocus>
                            Another Game
                        </Button>
                        </DialogActions>
                    </Dialog>
                    <table>
                        <tbody>
                            <tr>
                                <td colSpan={colspanm}>{`Player1 (You) - ${color}`}</td>
                                <td colSpan={colspanm}>{`Player2 - ${ocolor}`}</td>
                            </tr>
                            <tr>
                                <td colSpan={colspanm}>{name + turnstr}</td>
                                <td colSpan={colspanm}>{oname + oturnstr}</td>
                            </tr>
                            {/* <tr>
                                <td colSpan={colspanm}>
                                    <img
                                    src={require('./whiteStone.png')}
                                    alt=""
                                    style={{height:"100%", display: "block"}}
                                    ></img>
                                </td>
                                <td colSpan={colspanm}>
                                    <img
                                    src={require('./blackStone.png')}
                                    alt=""
                                    style={{height:"100%", display: "block"}}
                                    ></img>
                                </td>
                            </tr> */}
                            {board.map((row, i) => ( 
                                <tr key={i}>
                                    {
                                        row.map((elem, j) => {
                                            return (
                                                <td
                                                key={`${i}_${j}`}
                                                onClick={this.tableClick.bind(this, i, j)}
                                                style={{cellpadding: "0", cellspacing: "0", padding: "0"}}
                                                >
                                                    <img
                                                    id={`piece-img-${i}-${j}`}
                                                    src={require('./background.png')}
                                                    style={{width:"100%", height:"100%", display: "block"}}
                                                    alt=""
                                                    ></img>
                                                </td>
                                            )
                                        })
                                    }
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
        } else if (phase === 2 || phase === 1) {
            return (
                <ThemeProvider theme={theme}>
                    <Container component="main" maxWidth="xs">
                        <CssBaseline />
                        <Box
                        sx={{
                            marginTop: 30,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                        >
                        <Typography component="h1" variant="h5">
                            Your Name: {name}
                        </Typography>
                        <Button
                        onClick={this.wantToPlay}
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        >
                        {searchBtnMsg}
                        </Button>
                        </Box>
                    </Container>
                </ThemeProvider>
            )
        } else {
            return (
                <ThemeProvider theme={theme}>
                    <Container component="main" maxWidth="xs">
                        <CssBaseline />
                        <Box
                        sx={{
                            marginTop: 30,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                        >
                        <Typography component="h1" variant="h5">
                            GoMoKu
                        </Typography>
                        <Box component="form" onSubmit={this.handleEnterGame} noValidate sx={{ mt: 1 }}>
                            <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="uname"
                            label="player name"
                            name="uname"
                            autoFocus
                            />
                            <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            >
                            Enter Game
                            </Button>
                        </Box>
                        </Box>
                    </Container>
                </ThemeProvider>
            );
        }
    }
}

export default App;
