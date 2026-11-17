import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { C } from './theme';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { listenForForegroundMessages, registerForPushNotifications } from './notifications';

type Tournament = { id: string; title?: string; game?: string; startAt?: string; status?: string; prizeDescription?: string };

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState('Home');
  const [matches, setMatches] = useState<Tournament[]>([]);

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    if (!user) return;
    registerForPushNotifications().then(token => {
      if (token) console.log('FCM token registered; save it securely to the user device record:', token);
    }).catch(err => console.warn('Push registration failed', err));
    return listenForForegroundMessages((title, body) => Alert.alert(title, body));
  }, [user]);

  async function loadMatches() {
    try {
      const snap = await getDocs(query(collection(db, 'tournaments'), orderBy('startAt', 'asc')));
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Tournament)));
    } catch {
      Alert.alert('Could not load tournaments', 'Check Firebase configuration, Firestore rules and network.');
    }
  }

  async function authenticate(create: boolean) {
    try {
      if (create) await createUserWithEmailAndPassword(auth, email.trim(), password);
      else await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      Alert.alert('Authentication error', e.message ?? 'Please try again.');
    }
  }

  if (!user) return <SafeAreaView style={s.root}>
    <StatusBar style="light" />
    <View style={s.auth}>
      <Text style={s.logo}>DROPZONE</Text>
      <Text style={s.sub}>PLAY  ·  COMPETE  ·  IMPROVE</Text>
      <TextInput style={s.input} placeholder="Email address" placeholderTextColor={C.muted} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}/>
      <TextInput style={s.input} placeholder="Password" placeholderTextColor={C.muted} secureTextEntry value={password} onChangeText={setPassword}/>
      <Pressable style={s.primary} onPress={() => authenticate(false)}><Text style={s.primaryText}>SIGN IN</Text></Pressable>
      <Pressable style={s.secondary} onPress={() => authenticate(true)}><Text style={s.secondaryText}>CREATE ACCOUNT</Text></Pressable>
      <Text style={s.note}>Connect your Firebase project before using authentication.</Text>
    </View>
  </SafeAreaView>;

  return <SafeAreaView style={s.root}>
    <StatusBar style="light" />
    <View style={s.header}><Text style={s.logoSmall}>DROPZONE</Text><Text style={s.user}>{user.email}</Text></View>
    <ScrollView contentContainerStyle={s.content}>
      {tab === 'Home' && <>
        <Text style={s.eyebrow}>COMPETE ON YOUR TERMS</Text><Text style={s.heading}>Find your next match.</Text>
        <View style={s.hero}><Text style={s.heroLabel}>DROPZONE NOIR</Text><Text style={s.heroTitle}>READY UP.</Text><Text style={s.heroCopy}>Discover community tournaments and track your progress.</Text></View>
        <View style={s.row}><Text style={s.section}>Featured tournaments</Text><Pressable onPress={loadMatches}><Text style={s.action}>REFRESH</Text></Pressable></View>
        {matches.map(m => <TournamentCard key={m.id} item={m}/>)}
        {!matches.length && <Text style={s.note}>No tournaments loaded yet. Add published tournament documents to Firestore.</Text>}
      </>}
      {tab === 'Matches' && <>
        <Text style={s.heading}>Matches</Text><Pressable style={s.secondary} onPress={loadMatches}><Text style={s.secondaryText}>LOAD TOURNAMENTS</Text></Pressable>
        {matches.map(m => <TournamentCard key={m.id} item={m}/>)}
      </>}
      {tab === 'Profile' && <>
        <Text style={s.heading}>Player profile</Text><View style={s.panel}><Text style={s.section}>{user.email}</Text><Text style={s.note}>Your verified tournament statistics and achievements will appear here as results are published.</Text></View>
        <Pressable style={s.secondary} onPress={() => registerForPushNotifications().then(t => Alert.alert(t ? 'Notifications enabled' : 'Permission not granted', t ? 'Device registered for push. Backend token storage still needs configuration.' : 'Enable notifications in Android settings.'))}><Text style={s.secondaryText}>ENABLE MATCH ALERTS</Text></Pressable>
        <Pressable style={s.secondary} onPress={() => signOut(auth)}><Text style={s.secondaryText}>SIGN OUT</Text></Pressable>
      </>}
      {tab === 'Wallet' && <><Text style={s.heading}>Wallet</Text><View style={s.panel}><Text style={s.section}>Non-cash version</Text><Text style={s.note}>No deposits, withdrawals or cash prizes are enabled in this starter project.</Text></View></>}
    </ScrollView>
    <View style={s.nav}>{['Home','Matches','Wallet','Profile'].map(t=><Pressable key={t} onPress={()=>setTab(t)} style={s.navItem}><Text style={[s.navText,tab===t&&s.navActive]}>{t}</Text></Pressable>)}</View>
  </SafeAreaView>;
}

function TournamentCard({ item }: { item: Tournament }) {
  return <View style={s.card}>
    <View style={s.row}><Text style={s.cardGame}>{item.game ?? 'ESPORTS'}</Text><Text style={s.status}>{(item.status ?? 'UPCOMING').toUpperCase()}</Text></View>
    <Text style={s.cardTitle}>{item.title ?? 'Untitled tournament'}</Text>
    <Text style={s.note}>{item.startAt ? new Date(item.startAt).toLocaleString() : 'Start time not set'}</Text>
    <Text style={s.note}>{item.prizeDescription ?? 'Community tournament'}</Text>
  </View>;
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg}, auth:{flex:1,justifyContent:'center',padding:26},
  logo:{color:C.white,fontSize:34,fontWeight:'900',letterSpacing:4,textAlign:'center'},
  sub:{color:C.red,textAlign:'center',letterSpacing:2,marginTop:8,marginBottom:38,fontSize:10},
  input:{backgroundColor:C.surface,borderColor:C.border,borderWidth:1,borderRadius:12,padding:16,color:C.white,marginBottom:12},
  primary:{backgroundColor:C.red,borderRadius:12,padding:16,alignItems:'center',marginTop:8},
  primaryText:{color:C.white,fontWeight:'800',letterSpacing:1}, secondary:{borderColor:C.border,borderWidth:1,borderRadius:12,padding:15,alignItems:'center',marginTop:12},
  secondaryText:{color:C.silver,fontWeight:'700',letterSpacing:1}, note:{color:C.muted,fontSize:12,lineHeight:19,marginTop:12},
  header:{paddingHorizontal:20,paddingVertical:15,borderBottomWidth:1,borderColor:C.border,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  logoSmall:{color:C.white,fontWeight:'900',letterSpacing:2,fontSize:18},user:{color:C.muted,fontSize:10,maxWidth:'48%'},
  content:{padding:20,paddingBottom:30},eyebrow:{color:C.red,fontSize:10,letterSpacing:2,fontWeight:'800'},
  heading:{color:C.white,fontSize:29,fontWeight:'900',marginTop:8,marginBottom:18},
  hero:{backgroundColor:C.surface,borderWidth:1,borderColor:C.border,borderRadius:18,padding:22,marginBottom:25},
  heroLabel:{color:C.red,fontSize:10,letterSpacing:2,fontWeight:'800'},heroTitle:{color:C.white,fontSize:32,fontWeight:'900',marginTop:8},
  heroCopy:{color:C.muted,marginTop:6,lineHeight:20},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  section:{color:C.white,fontWeight:'800',fontSize:16},action:{color:C.red,fontWeight:'800',fontSize:11},
  card:{backgroundColor:C.surface,borderRadius:15,borderWidth:1,borderColor:C.border,padding:16,marginTop:12},
  cardGame:{color:C.silver,fontSize:10,fontWeight:'800',letterSpacing:1},status:{color:C.red,fontSize:10,fontWeight:'900'},
  cardTitle:{color:C.white,fontSize:18,fontWeight:'800',marginTop:12},panel:{backgroundColor:C.surface,borderRadius:15,padding:18,borderWidth:1,borderColor:C.border},
  nav:{flexDirection:'row',borderTopWidth:1,borderColor:C.border,paddingVertical:13,backgroundColor:C.surface},
  navItem:{flex:1,alignItems:'center'},navText:{color:C.muted,fontSize:12,fontWeight:'700'},navActive:{color:C.white}
});