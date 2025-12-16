import React, { useEffect, useRef } from "react";
import { 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Image, 
  View,
  Platform,
  Text
} from "react-native";

export default function Card({ card, handleChoice, flipped, cardSize }) {
  // Animated value: 0 = back visible, 180 = front visible
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Trigger animation when 'flipped' prop changes
  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: flipped ? 180 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [flipped]);

  // Interpolate values for front and back rotation
  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
  const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

  const handleClick = () => {
    if (!flipped) handleChoice(card);
  };

  return (
    <View style={[styles.cardContainer, { width: cardSize, height: cardSize }]}>
      <TouchableOpacity activeOpacity={1} onPress={handleClick} style={styles.touchable}>
        
        {/* Front of Card (The Image) */}
        <Animated.View style={[styles.cardFace, styles.cardFront, frontAnimatedStyle]}>
          <Image 
            source={card.src} // Uses the source object passed from App.js
            style={styles.image} 
            resizeMode="cover"
          />
        </Animated.View>

        {/* Back of Card (The Pattern) */}
        <Animated.View style={[styles.cardFace, styles.cardBack, backAnimatedStyle]}>
          <Image 
             source={require('./assets/images/cardbacktest.png')} 
             style={styles.image} 
             resizeMode="cover" 
          />
        </Animated.View>
        
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    margin: 4,
  },
  touchable: {
    flex: 1,
  },
  cardFace: {
    width: "100%",
    height: "100%",
    position: "absolute",
    backfaceVisibility: "hidden", // Crucial for 3D effect on mobile
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  cardFront: {
    backgroundColor: "white",
  },
  cardBack: {
    backgroundColor: "#0056b3", // Match your theme color
    justifyContent: "center",
    alignItems: "center",
  },
  backPattern: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0056b3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 8,
  },
  questionMark: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 24,
    fontWeight: 'bold',
  },
  image: {
    width: "100%",
    height: "100%",
  },
});