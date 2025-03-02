import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

const Hangman = () => {
  const [word, setWord] = useState('DEBRECEN');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [remainingGuesses, setRemainingGuesses] = useState(6);
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const figureGroupRef = useRef(null);
  const animationRef = useRef(null);

  const maskedWord = word
    .split('')
    .map((letter) => guessedLetters.includes(letter) ? letter : '_')
    .join(' ');

  const resetGame = () => {
    const words = ['EGER', 'BUDAPEST', 'SZEGED', 'KECSKEMET', 'SOPRON', 'BALATON', 'TISZA', 'DUNA', 'BAKONY'];
    setWord(words[Math.floor(Math.random() * words.length)]);
    setGuessedLetters([]);
    setRemainingGuesses(6);
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const mountNode = mountRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 15, 25);
    scene.background = new THREE.Color(0x87CEEB);

    const camera = new THREE.PerspectiveCamera(
      window.innerWidth < 768 ? 75 : 75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(
      window.innerWidth < 768 ? -2.5 : 0.5,
      window.innerWidth < 768 ? 3 : 1,
      window.innerWidth < 768 ? 5 : 6
    );
    camera.lookAt(-2, 0.5, -1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(
      window.innerWidth < 768 ? window.innerWidth * 0.98 : window.innerWidth * 0.6,
      window.innerWidth < 768 ? window.innerHeight * 0.45 : window.innerHeight * 0.5
    );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountNode.appendChild(renderer.domElement);

    // Store references
    rendererRef.current = renderer;
    sceneRef.current = scene;

    // Initialize figure group
    const figureGroup = new THREE.Group();
    scene.add(figureGroup);
    figureGroupRef.current = figureGroup;

    // Initialize TextureLoader and scene elements
    const textureLoader = new THREE.TextureLoader();

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Sun with animation
    const sunLight = new THREE.DirectionalLight(0xffd500, 1);
    sunLight.position.set(15, 12, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    scene.add(sunLight);

    // Sun sphere
    const sunGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(15, 12, 5);
    scene.add(sun);

    // Create castle walls
    const createCastleWalls = () => {
      const wallsGroup = new THREE.Group();
      const stoneMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.2
      });

      // Wall segments
      const createWallSegment = (width, height, depth, position) => {
        const wall = new THREE.Mesh(
          new THREE.BoxGeometry(width, height, depth),
          stoneMaterial
        );
        wall.position.copy(position);
        wall.castShadow = true;
        wall.receiveShadow = true;
        return wall;
      };

      const wallHeight = 8;
      const wallThickness = 2;
      
      const backWall = createWallSegment(30, wallHeight, wallThickness, new THREE.Vector3(0, wallHeight/2 - 2, -20));
      const frontWall = createWallSegment(30, wallHeight/2, wallThickness, new THREE.Vector3(0, wallHeight/4 - 2, 8));
      const leftWall = createWallSegment(wallThickness, wallHeight, 30, new THREE.Vector3(-14, wallHeight/2 - 2, -6));
      const rightWall = createWallSegment(wallThickness, wallHeight, 30, new THREE.Vector3(14, wallHeight/2 - 2, -6));

      // Towers
      const createTower = (position) => {
        const tower = new THREE.Mesh(
          new THREE.CylinderGeometry(2, 2, wallHeight + 2, 8),
          stoneMaterial
        );
        tower.position.copy(position);
        
        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(2.5, 2, 8),
          new THREE.MeshStandardMaterial({ color: 0x800000 })
        );
        roof.position.copy(position);
        roof.position.y += wallHeight/2 + 1;
        
        return [tower, roof];
      };

      const towerPositions = [
        new THREE.Vector3(-14, wallHeight/2 - 2, -15),
        new THREE.Vector3(14, wallHeight/2 - 2, -15),
        new THREE.Vector3(-14, wallHeight/2 - 2, 5),
        new THREE.Vector3(14, wallHeight/2 - 2, 5)
      ];

      towerPositions.forEach(position => {
        const [tower, roof] = createTower(position);
        wallsGroup.add(tower, roof);
      });

      wallsGroup.add(backWall, frontWall, leftWall, rightWall);
      return wallsGroup;
    };

    const castleWalls = createCastleWalls();
    scene.add(castleWalls);

    // Create trees
    const createTree = (x, z) => {
      const treeGroup = new THREE.Group();
      
      // Trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 2, 8),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
      );
      trunk.position.y = -1;
      trunk.castShadow = true;
      treeGroup.add(trunk);
      
      // Leaves
      const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(1, 2, 8),
        new THREE.MeshStandardMaterial({ color: 0x228B22 })
      );
      leaves.position.y = 0.5;
      leaves.castShadow = true;
      treeGroup.add(leaves);
      
      treeGroup.position.set(x, 0, z);
      return treeGroup;
    };

    // Add multiple trees
    const trees = [
      createTree(-10, -10),
      createTree(-8, -8),
      createTree(10, -10),
      createTree(8, -8),
      createTree(-9, 4),
      createTree(9, 4)
    ];
    trees.forEach(tree => scene.add(tree));

    // Create executioner
    const createExecutioner = () => {
      const executionerGroup = new THREE.Group();
      
      // Body
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
      );
      body.position.y = -1;
      executionerGroup.add(body);
      
      // Head with hood
      const head = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 0.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
      );
      head.position.y = -0.2;
      executionerGroup.add(head);
      
      // Axe
      const axeHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
      );
      axeHandle.rotation.z = Math.PI / 4;
      axeHandle.position.set(0.4, -0.8, 0);
      executionerGroup.add(axeHandle);
      
      const axeHead = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.4, 4),
        new THREE.MeshStandardMaterial({ color: 0x808080 })
      );
      axeHead.rotation.z = -Math.PI / 2;
      axeHead.position.set(0.8, -0.6, 0);
      executionerGroup.add(axeHead);
      
      executionerGroup.position.set(-5, 0, 0);
      return executionerGroup;
    };

    const executioner = createExecutioner();
    scene.add(executioner);

    // Create crowd
    const createPerson = (color, x, z, scale = 1) => {
      const personGroup = new THREE.Group();
      
      // Body
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 1 * scale),
        new THREE.MeshStandardMaterial({ color })
      );
      body.position.y = -1.5;
      personGroup.add(body);
      
      // Head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.2 * scale),
        new THREE.MeshStandardMaterial({ color: 0xFFE4C4 })
      );
      head.position.y = -0.9;
      personGroup.add(head);
      
      personGroup.position.set(x, 0, z);
      return personGroup;
    };

    // Add king, queen, and crowd
    const king = createPerson(0xFFD700, 4, -3, 1.2);
    const queen = createPerson(0x800080, 5, -3, 1.1);
    const guard1 = createPerson(0x8B0000, -4, -3);
    const guard2 = createPerson(0x8B0000, -5, -3);
    
    // Add dogs
    const createDog = (x, z) => {
      const dogGroup = new THREE.Group();
      
      // Body
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.15, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
      );
      body.rotation.z = Math.PI / 2;
      body.position.y = -1.7;
      dogGroup.add(body);
      
      // Head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.15),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
      );
      head.position.set(0.3, -1.7, 0);
      dogGroup.add(head);
      
      dogGroup.position.set(x, 0, z);
      return dogGroup;
    };

    const dog1 = createDog(3.5, -2);
    const dog2 = createDog(5.5, -2);
    
    scene.add(king, queen, guard1, guard2, dog1, dog2);

    // Ground with grass
    const groundGeometry = new THREE.PlaneGeometry(28, 20, 50, 50);
    const grassMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2d5a27,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    
    const ground = new THREE.Mesh(groundGeometry, grassMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grass field
    const createGrassField = () => {
      const grassGroup = new THREE.Group();
      const grassGeometry = new THREE.PlaneGeometry(0.1, 0.3);
      const grassMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3a7a35,
        side: THREE.DoubleSide,
        transparent: true
      });

      for (let i = 0; i < 1000; i++) {
        const blade = new THREE.Mesh(grassGeometry, grassMaterial);
        const x = (Math.random() - 0.5) * 25;
        const z = (Math.random() - 0.5) * 18;
        blade.position.set(x, -1.85, z);
        blade.rotation.x = Math.PI / 2;
        blade.rotation.z = Math.random() * Math.PI / 4;
        grassGroup.add(blade);
      }
      return grassGroup;
    };

    const grassField = createGrassField();
    scene.add(grassField);

    // Create gallows
    const createGallows = () => {
      const gallowsGroup = new THREE.Group();
      const woodTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/wood/hardwood2_diffuse.jpg');
      
      const woodMaterial = new THREE.MeshStandardMaterial({ 
        map: woodTexture,
        roughness: 0.8,
        metalness: 0.2
      });

      const base = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.3, 1),
        woodMaterial
      );
      base.position.y = -1.9;
      base.castShadow = true;
      base.receiveShadow = true;
      gallowsGroup.add(base);

      const pole = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 4, 0.3),
        woodMaterial
      );
      pole.position.set(-1, 0, 0);
      pole.castShadow = true;
      pole.receiveShadow = true;
      gallowsGroup.add(pole);

      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.3, 0.3),
        woodMaterial
      );
      beam.position.set(0, 1.9, 0);
      beam.castShadow = true;
      beam.receiveShadow = true;
      gallowsGroup.add(beam);

      const support = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 1.8, 0.2),
        woodMaterial
      );
      support.position.set(-1, 1.2, 0);
      support.rotation.z = Math.PI / 4;
      support.castShadow = true;
      support.receiveShadow = true;
      gallowsGroup.add(support);

      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.5),
        new THREE.MeshStandardMaterial({ 
          color: 0x8b4513,
          roughness: 1,
          metalness: 0
        })
      );
      rope.position.set(1, 1.65, 0);
      rope.castShadow = true;
      gallowsGroup.add(rope);

      gallowsGroup.position.set(-2, 0, -1);
      return gallowsGroup;
    };

    const gallows = createGallows();
    scene.add(gallows);

    // Animation loop
    let time = 0;
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      time += 0.02;
      
      // Grass animation
      grassField.children.forEach((blade, index) => {
        blade.rotation.z = Math.PI / 4 + Math.sin(time + index * 0.1) * 0.1;
      });

      // Swinging animation for the hanged figure
      if (figureGroupRef.current.children.length > 0) {
        figureGroupRef.current.rotation.z = Math.sin(time) * 0.1;
        figureGroupRef.current.rotation.x = Math.sin(time * 0.5) * 0.05;
      }

      // Háttérben lévő karakterek dülöngélése
      [king, queen, guard1, guard2].forEach((character, index) => {
        // Alap dülöngélés - csökkentett értékekkel
        character.rotation.z = Math.sin(time * 1.5 + index) * 0.03;
        character.rotation.x = Math.cos(time + index) * 0.02;
        
        // Enyhe oldalirányú mozgás - csökkentett érték
        character.position.x += Math.sin(time * 1.5 + index) * 0.0005;
        
        // Ha a játék véget ért, akkor erőteljesebb az animáció
        if (remainingGuesses === 0 || !maskedWord?.includes('_')) {
          character.position.y = Math.sin(time * 8 + index * 2) * 1.5;
          character.rotation.y = Math.sin(time * 4) * 0.5;
        }
      });

      // Executioner animation - csökkentett érték
      executioner.rotation.z = Math.sin(time * 1.2) * 0.02;
      
      // Make dogs spin and jump more energetically
      [dog1, dog2].forEach((dog, index) => {
        // Alap dülöngélés - csökkentett érték
        dog.rotation.z = Math.sin(time * 1.5 + index) * 0.05;
        
        // Ha a játék véget ért, akkor erőteljesebb az animáció
        if (remainingGuesses === 0 || !maskedWord?.includes('_')) {
          dog.position.y = Math.sin(time * 8 + index * 2) * 1;
          dog.rotation.y = time * 4;
        }
      });

      // Sun movement
      sun.position.x = 15 * Math.cos(time * 0.1);
      sun.position.y = 12 + Math.sin(time * 0.1) * 2;
      sunLight.position.copy(sun.position);

      renderer.render(scene, camera);
    };
    
    animate();

    // Handle window resize
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      camera.aspect = window.innerWidth / window.innerHeight;
      
      camera.position.set(
        isMobile ? -2.5 : 0.5,
        isMobile ? 3 : 1,
        isMobile ? 5 : 6
      );
      camera.lookAt(-2, 0.5, -1);
      
      camera.updateProjectionMatrix();
      renderer.setSize(
        isMobile ? window.innerWidth * 0.98 : window.innerWidth * 0.6,
        isMobile ? window.innerHeight * 0.45 : window.innerHeight * 0.5
      );
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      if (mountNode) {
        mountNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!figureGroupRef.current) return;

    // Először eltávolítjuk az összes meglévő testrészt
    while(figureGroupRef.current.children.length) {
      figureGroupRef.current.remove(figureGroupRef.current.children[0]);
    }

    const bodyParts = [];
    const maxGuesses = 6;
    const missingGuesses = maxGuesses - remainingGuesses;

    // Fej
    const headGroup = new THREE.Group();
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 32, 32),
      new THREE.MeshStandardMaterial({ 
        color: 0xFFE4C4,
        roughness: 0.5,
        metalness: 0.1
      })
    );
    
    const eyeGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 0, 0.25);
    leftEye.scale.set(0.8, 1, 0.1);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 0, 0.25);
    rightEye.scale.set(0.8, 1, 0.1);
    
    headGroup.add(head, leftEye, rightEye);
    headGroup.position.set(0, 1.3, 0);
    headGroup.castShadow = true;
    if (missingGuesses > 0) bodyParts.push(headGroup);

    // Test
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.25, 1.2),
      new THREE.MeshStandardMaterial({ 
        color: 0xFF0000,
        roughness: 0.7,
        metalness: 0.1
      })
    );
    body.position.set(0, 0.4, 0);
    body.castShadow = true;
    if (missingGuesses > 1) bodyParts.push(body);

    // Bal kar
    const leftArm = new THREE.Group();
    const leftUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.06, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xFF0000 })
    );
    leftUpperArm.position.set(0, -0.2, 0);
    leftUpperArm.rotation.z = Math.PI / 6;
    leftArm.add(leftUpperArm);
    leftArm.position.set(-0.3, 0.8, 0);
    leftArm.castShadow = true;
    if (missingGuesses > 2) bodyParts.push(leftArm);

    // Jobb kar
    const rightArm = new THREE.Group();
    const rightUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.06, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xFF0000 })
    );
    rightUpperArm.position.set(0, -0.2, 0);
    rightUpperArm.rotation.z = -Math.PI / 6;
    rightArm.add(rightUpperArm);
    rightArm.position.set(0.3, 0.8, 0);
    rightArm.castShadow = true;
    if (missingGuesses > 3) bodyParts.push(rightArm);

    // Bal láb
    const leftLeg = new THREE.Group();
    const leftUpperLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.07, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xFF0000 })
    );
    leftUpperLeg.position.set(0, -0.4, 0);
    leftUpperLeg.rotation.z = Math.PI / 12;
    leftLeg.add(leftUpperLeg);
    leftLeg.position.set(-0.2, -0.2, 0);
    leftLeg.castShadow = true;
    if (missingGuesses > 4) bodyParts.push(leftLeg);

    // Jobb láb
    const rightLeg = new THREE.Group();
    const rightUpperLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.07, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xFF0000 })
    );
    rightUpperLeg.position.set(0, -0.4, 0);
    rightUpperLeg.rotation.z = -Math.PI / 12;
    rightLeg.add(rightUpperLeg);
    rightLeg.position.set(0.2, -0.2, 0);
    rightLeg.castShadow = true;
    if (missingGuesses > 5) bodyParts.push(rightLeg);
    
    // Hozzáadjuk az összes testrészt a figureGroup-hoz
    bodyParts.forEach(part => figureGroupRef.current.add(part));
    figureGroupRef.current.position.set(-1, 0.1, -1);
  }, [remainingGuesses]);

  const handleGuess = (event) => {
    const letter = event.currentTarget.value.toUpperCase();
    if (!guessedLetters.includes(letter)) {
      setGuessedLetters([...guessedLetters, letter]);
      if (!word.includes(letter)) {
        setRemainingGuesses(remainingGuesses - 1);
      }
    }
  };

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const gameStatus = () => {
    if (remainingGuesses === 0) return 'Játék vége!';
    if (!maskedWord.includes('_')) return 'Nyertél!';
    return `Hátralévő próbálkozások: ${remainingGuesses}`;
  };

  const containerStyle = { 
    textAlign: 'center', 
    height: '100vh',
    background: 'linear-gradient(45deg, #1a2a3a 0%, #2c3e50 100%)',
    padding: window.innerWidth < 768 ? '5px' : '10px',
    boxSizing: 'border-box',
    display: 'grid',
    gridTemplateRows: 'auto auto 1fr auto auto',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'MedievalSharp', cursive",
    color: '#d4af37',
    overflow: 'hidden'
  };
  
  const canvasContainerStyle = { 
    margin: window.innerWidth < 768 ? '2px auto' : '5px auto',
    width: window.innerWidth < 768 ? '98vw' : '60vw',
    height: window.innerWidth < 768 ? '40vh' : '50vh',
    border: window.innerWidth < 768 ? '4px solid #8b4513' : '8px solid #8b4513',
    borderRadius: window.innerWidth < 768 ? '4px' : '8px',
    overflow: 'hidden',
    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
    background: 'linear-gradient(to bottom, #87CEEB 0%, #87CEEB 100%)',
    position: 'relative',
    zIndex: 1
  };
  
  const wordStyle = { 
    fontSize: 'min(4vw, 2em)',
    margin: '5px',
    letterSpacing: '0.2em',
    fontWeight: 'bold',
    color: '#d4af37',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
  };
  
  const buttonContainerStyle = { 
    margin: '5px',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: window.innerWidth < 768 ? '8px' : '5px',
    maxWidth: '95vw',
    padding: window.innerWidth < 768 ? '10px' : '5px'
  };
  
  const buttonStyle = { 
    margin: window.innerWidth < 768 ? '2px' : '2px',
    padding: window.innerWidth < 768 ? '8px 12px' : '8px 12px',
    fontSize: window.innerWidth < 768 ? '1.2em' : '1.2em',
    borderRadius: '4px',
    border: '2px solid #8b4513',
    background: 'linear-gradient(to bottom, #8b4513, #654321)',
    color: '#d4af37',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    fontFamily: "'MedievalSharp', cursive",
    minWidth: window.innerWidth < 768 ? '35px' : '35px'
  };

  const restartButtonStyle = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: window.innerWidth < 768 ? '1.2em' : '1.4em',
    padding: '15px 30px',
    background: 'linear-gradient(to bottom, #d4af37, #b4941f)',
    border: '3px solid #8b4513',
    color: '#2c3e50',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: 'pointer',
    zIndex: 1000,
    fontFamily: "'MedievalSharp', cursive",
    boxShadow: '0 0 15px rgba(0,0,0,0.5)'
  };

  const statusStyle = {
    fontSize: 'calc(1.2vw + 0.8em)',
    color: remainingGuesses === 0 ? '#ff6b6b' : 
           !maskedWord.includes('_') ? '#d4af37' : '#d4af37',
    margin: '10px',
    fontWeight: 'bold',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
  };

  const titleStyle = {
    color: '#d4af37',
    margin: '5px',
    fontSize: 'min(5vw, 2.5em)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    textShadow: '3px 3px 6px rgba(0,0,0,0.5)',
    fontWeight: 'bold'
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap" rel="stylesheet" />
      <div style={containerStyle}>
        <h1 style={titleStyle}>3D Akasztófa Játék</h1>
        <div ref={mountRef} style={canvasContainerStyle}>
          {(remainingGuesses === 0 || !maskedWord.includes('_')) && (
            <button 
              onClick={resetGame}
              style={restartButtonStyle}
            >
              Új Játék
            </button>
          )}
        </div>
        <div style={wordStyle}>{maskedWord}</div>
        <div style={statusStyle}>{gameStatus()}</div>
        <div style={buttonContainerStyle}>
          {alphabet.map((letter) => (
            <button
              key={letter}
              value={letter}
              onClick={handleGuess}
              disabled={guessedLetters.includes(letter) || remainingGuesses === 0 || !maskedWord.includes('_')}
              style={{
                ...buttonStyle,
                background: guessedLetters.includes(letter) 
                  ? 'linear-gradient(to bottom, #4a4a4a, #3a3a3a)'
                  : remainingGuesses === 0 || !maskedWord.includes('_')
                  ? 'linear-gradient(to bottom, #4a4a4a, #3a3a3a)'
                  : 'linear-gradient(to bottom, #8b4513, #654321)',
                opacity: guessedLetters.includes(letter) ? 0.7 : 1,
                cursor: guessedLetters.includes(letter) || remainingGuesses === 0 || !maskedWord.includes('_')
                  ? 'not-allowed' 
                  : 'pointer'
              }}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Hangman;