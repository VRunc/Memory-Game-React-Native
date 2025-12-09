import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Modal,
  Dimensions,
  Alertr
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from "./Card";

// --- Asset Setup ---
const cardImages = [
 { src: require("./assets/images/turneiffel.jpg"), id_ref: "eiffel", matched: false },
 { src: require("./assets/images/coloseum.png"), id_ref: "coloseum", matched: false },
 { src: require("./assets/images/tajmahal.jpg"), id_ref: "tajmahal", matched: false },
 { src: require("./assets/images/piramide.jpg"), id_ref: "piramide", matched: false },
 { src: require("./assets/images/sfinx.jpg"), id_ref: "sfinx", matched: false },
 { src: require("./assets/images/arcdetriumf.jpg"), id_ref: "arc", matched: false },
 { src: require("./assets/images/statueofliberty.jpg"), id_ref: "liberty", matched: false },
 { src: require("./assets/images/zidchina.jpg"), id_ref: "wall", matched: false },
 { src: require("./assets/images/chichenitza.jpg"), id_ref: "chichen", matched: false },
 { src: require("./assets/images/colosusofrhodes.jpg"), id_ref: "colossus", matched: false },
 { src: require("./assets/images/machupichu.jpg"), id_ref: "machu", matched: false },
 { src: require("./assets/images/mausoleum.jpg"), id_ref: "mausoleum", matched: false },
 { src: require("./assets/images/barrier-reef.jpg"), id_ref: "reef", matched: false },
 { src: require("./assets/images/alexandrialighthouse.jpg"), id_ref: "lighthouse", matched: false },
 { src: require("./assets/images/munte-everest.jpg"), id_ref: "everest", matched: false },
];

const DIFFICULTY_LEVELS = {
  easy: { pairs: 6, cols: 3 }, // Adjusted cols for mobile portrait
  medium: { pairs: 10, cols: 4 },
  hard: { pairs: 14, cols: 5 }, // 7 cols is too tight on phone, reduced to 5
};

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- Scoreboard Component (Modal Version) ---
function ScoreboardModal({ visible, onClose, scores }) {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>History</Text>
          {scores.length === 0 ? (
            <Text style={styles.noScores}>No games played yet.</Text>
          ) : (
            scores.slice(0, 5).map((score, index) => (
              <View key={index} style={styles.scoreItem}>
                <Text style={styles.scoreText}>{index + 1}. {score.winner}</Text>
                <Text style={styles.scoreMoves}>{score.scoreText}</Text>
              </View>
            ))
          )}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function App() {
  const [cards, setCards] = useState([]);
  const [firstChoice, setFirstChoice] = useState(null);
  const [secondChoice, setSecondChoice] = useState(null);
  const [disabled, setDisabled] = useState(false);
  
  const [gameMode, setGameMode] = useState('single');
  const [difficulty, setDifficulty] = useState('easy');
  
  const [turns, setTurns] = useState(0);
  const [p1Turns, setP1Turns] = useState(0);
  const [p2Turns, setP2Turns] = useState(0);
  const [activePlayer, setActivePlayer] = useState(1);
  
  const [scoreHistory, setScoreHistory] = useState([]);
  const [showScoreboard, setShowScoreboard] = useState(false);

useEffect(() => {
    const loadScores = async () => {
      try {  
        const storedScores = await AsyncStorage.getItem('memoryGameScores');
        if (storedScores) {
          setScoreHistory(JSON.parse(storedScores));
        }
      } catch (error) { 
        console.error("Error loading scores", error);
      }
    };
    loadScores();
  }, []);
  // Save Score
  const saveLocalScore = async (mode, p1S, p2S) => {
    let newScore;
    if (mode === 'single') {
      newScore = { mode: 'single', winner: 'Single Player', scoreText: `${turns} moves`, level: difficulty };
    } else {
      let winner = '';
      let scoreText = `${p1Turns} vs ${p2Turns}`;
      if (p1Turns < p2Turns) winner = 'Player 1';
      else if (p2Turns < p1Turns) winner = 'Player 2';
      else {
        winner = 'Draw';
        scoreText = `Draw: ${p1Turns}`;
      }
      newScore = { mode: 'multi', winner: winner, scoreText: scoreText, level: difficulty };
    }

    const updatedScores = [newScore, ...scoreHistory].slice(0, 10);
    setScoreHistory(updatedScores);
    try {
      await AsyncStorage.setItem('memoryGameScores', JSON.stringify(updatedScores));
    } catch (e) {
      console.error("Error saving score", e);
    }
  };

  const shuffleCards = () => {
    const { pairs } = DIFFICULTY_LEVELS[difficulty];
    
    // Create deep copies to avoid reference issues
    const selectedCards = [...cardImages]
      .sort(() => Math.random() - 0.5)
      .slice(0, pairs);

    const shuffled = [...selectedCards, ...selectedCards]
      .sort(() => Math.random() - 0.5)
      .map((card) => ({ ...card, id: Math.random() })); // React Native unique ID

    setFirstChoice(null);
    setSecondChoice(null);
    setCards(shuffled);
    setTurns(0);
    setP1Turns(0);
    setP2Turns(0);
    setActivePlayer(1);
  };

  const toggleMode = (mode) => {
    setGameMode(mode);
    shuffleCards();
  };

  const handleDifficultyChange = (level) => {
    setDifficulty(level);
  };
  
  // Re-shuffle when difficulty changes
  useEffect(() => {
    shuffleCards();
  }, [difficulty]);

  const handleChoice = (card) => {
    if (!disabled) {
      firstChoice ? setSecondChoice(card) : setFirstChoice(card);
    }
  };

  // Compare choices
  useEffect(() => {
    if (firstChoice && secondChoice) {
      setDisabled(true);
      // Compare based on the reference ID we added to image objects
      // Note: In RN local assets, comparing 'src' numbers works, but 'id_ref' is safer
      const isMatch = firstChoice.id_ref === secondChoice.id_ref;
      
      if (isMatch) {
        setCards((prev) =>
          prev.map((card) =>
            card.id_ref === firstChoice.id_ref ? { ...card, matched: true } : card
          )
        );
        resetTurn(true);
      } else {
        setTimeout(() => resetTurn(false), 1000);
      }
    }
  }, [firstChoice, secondChoice]);

  const resetTurn = (isMatch = false) => {
    if (gameMode === 'single') {
      setTurns((prev) => prev + 1);
    } else {
      if (activePlayer === 1) setP1Turns((prev) => prev + 1);
      else setP2Turns((prev) => prev + 1);
      
      if (!isMatch) {
        setActivePlayer(activePlayer === 1 ? 2 : 1);
      }
    }
    setFirstChoice(null);
    setSecondChoice(null);
    setDisabled(false);
  };

  // Check Win
  useEffect(() => {
    const allMatched = cards.length > 0 && cards.every((card) => card.matched);
    if (allMatched) {
      if (gameMode === 'single') saveLocalScore('single', turns, 0);
      else saveLocalScore('multi', p1Turns, p2Turns);
      
      Alert.alert("Victory!", "Game Over. Check the scoreboard!");
    }
  }, [cards]);

  // --- Dynamic Grid Calculation ---
  const currentCols = DIFFICULTY_LEVELS[difficulty].cols;
  // Calculate Card Size: (Screen - (Margins)) / Cols
  // Limit the grid width to 500px max (so it doesn't stretch on desktop)
const effectiveWidth = Math.min(SCREEN_WIDTH, 700); 

const cardSize = (effectiveWidth - 40) / currentCols - 8;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Monuments Memory</Text>
        
        {/* Difficulty Selector */}
        <View style={styles.pillContainer}>
          {Object.keys(DIFFICULTY_LEVELS).map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.pill, difficulty === level && styles.activePill]}
              onPress={() => handleDifficultyChange(level)}
            >
              <Text style={[styles.pillText, difficulty === level && styles.activePillText]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Game Mode & Scoreboard Toggle */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.newGameBtn} onPress={shuffleCards}>
            <Text style={styles.newGameText}>New Game</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.historyBtn} onPress={() => setShowScoreboard(true)}>
             <Text style={styles.historyText}>Scores</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Display */}
        <View style={styles.statsContainer}>
          <View style={styles.modeToggle}>
            <TouchableOpacity onPress={() => toggleMode('single')}>
              <Text style={[styles.modeText, gameMode === 'single' && styles.activeModeText]}>Single</Text>
            </TouchableOpacity>
            <Text style={styles.divider}>|</Text>
            <TouchableOpacity onPress={() => toggleMode('multi')}>
              <Text style={[styles.modeText, gameMode === 'multi' && styles.activeModeText]}>Multi</Text>
            </TouchableOpacity>
          </View>

          {gameMode === 'single' ? (
             <Text style={styles.turnText}>Moves: <Text style={styles.highlight}>{turns}</Text></Text>
          ) : (
            <View style={styles.multiStats}>
              <View style={[styles.pTag, activePlayer === 1 && styles.p1Active]}>
                <Text style={activePlayer === 1 ? styles.wText : styles.bText}>P1: {p1Turns}</Text>
              </View>
              <View style={[styles.pTag, activePlayer === 2 && styles.p2Active]}>
                <Text style={activePlayer === 2 ? styles.wText : styles.bText}>P2: {p2Turns}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Grid */}
      <View style={styles.gridContainer}>
        <FlatList
          data={cards}
          key={currentCols} // Key change forces re-render when cols change
          numColumns={currentCols}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card
              card={item}
              handleChoice={handleChoice}
              flipped={item === firstChoice || item === secondChoice || item.matched}
              cardSize={cardSize}
            />
          )}
        />
      </View>

      <ScoreboardModal 
        visible={showScoreboard} 
        onClose={() => setShowScoreboard(false)} 
        scores={scoreHistory} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    borderRadius: 20,
    padding: 2,
    marginBottom: 10,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 18,
  },
  activePill: {
    backgroundColor: '#007bff',
  },
  pillText: {
    color: '#555',
    fontWeight: '600',
  },
  activePillText: {
    color: '#fff',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  newGameBtn: {
    backgroundColor: '#343a40',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  newGameText: { color: '#fff', fontWeight: 'bold' },
  historyBtn: {
    backgroundColor: '#0056b3',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  historyText: { color: '#fff', fontWeight: 'bold' },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeText: { color: '#999', fontSize: 16, fontWeight: 'bold' },
  activeModeText: { color: '#007bff' },
  divider: { marginHorizontal: 8, color: '#ccc' },
  turnText: { fontSize: 18, fontWeight: '600', color: '#555' },
  highlight: { color: '#007bff' },
  multiStats: { flexDirection: 'row', gap: 10 },
  pTag: { padding: 4, borderRadius: 4, borderWidth: 1, borderColor: 'transparent' },
  p1Active: { backgroundColor: '#007bff' },
  p2Active: { backgroundColor: '#dc3545' },
  wText: { color: '#fff', fontWeight: 'bold' },
  bText: { color: '#555', fontWeight: 'bold' },
  
  gridContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  noScores: { color: '#777', fontStyle: 'italic' },
  scoreItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%', 
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  scoreText: { color: '#333' },
  scoreMoves: { color: '#28a745', fontWeight: 'bold' },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#6c757d',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: { color: 'white', fontWeight: 'bold' },
});