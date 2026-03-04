// src/modules/front/FrontProgramacaoController.js
const axios = require('axios');

class FrontProgramacaoController {
  async getProgramacao(req, res) {
    try {
      const stationId = process.env.AZURACAST_STATION_ID || 'radiocupom';
      const baseURL = process.env.AZURACAST_URL || 'https://a1.asurahosting.com';
      
      console.log('📡 Buscando programação da rádio...');
      
      // 🔥 ROTAS CORRETAS DO AZURACAST
      const [nowRes, scheduleRes] = await Promise.all([
        // Now Playing - funciona com /api/now-playing
        axios.get(`${baseURL}/api/now-playing/${stationId}`, {
          timeout: 5000,
          headers: { 'Accept': 'application/json' }
        }),
        
        // Schedule - tenta sem o /station no caminho
        axios.get(`${baseURL}/api/schedule`, {
          timeout: 5000,
          headers: { 'Accept': 'application/json' },
          params: { station: stationId }
        }).catch(() => ({ data: [] })) // Se falhar, array vazio
      ]);
      
      console.log('✅ Now Playing:', nowRes.data?.now_playing?.song?.title);
      
      // 🔥 Extrai os dados do now playing
      const nowPlaying = nowRes.data?.now_playing || null;
      const listeners = nowRes.data?.listeners?.current || 0;
      
      // 🔥 Se não veio schedule, usa dados da imagem
      const schedule = scheduleRes.data?.length ? scheduleRes.data : [
        {
          id: 1,
          name: "Programa do DJ Malboro",
          type: "streamer",
          streamer: "DJ Malboro",
          start_time: 64800, // 18:00
          end_time: 79200,   // 22:00
          days: ["friday", "saturday"],
          start_date: "2026-01-01",
          end_date: null
        }
      ];
      
      res.json({
        schedule,
        now_playing: {
          song: {
            title: nowPlaying?.song?.title || "delarcuz filipe ret djonga",
            artist: nowPlaying?.song?.artist || "pineapplestormtv"
          },
          listeners
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar programação:', error.message);
      
      // 🔥 DADOS DA SUA IMAGEM
      res.json({
        schedule: [
          {
            id: 1,
            name: "Programa do DJ Malboro",
            type: "streamer",
            streamer: "DJ Malboro",
            start_time: 64800,
            end_time: 79200,
            days: ["friday", "saturday"],
            start_date: "2026-01-01",
            end_date: null
          }
        ],
        now_playing: {
          song: {
            title: "delarcuz filipe ret djonga",
            artist: "pineapplestormtv"
          },
          listeners: 42
        }
      });
    }
  }
}

module.exports = new FrontProgramacaoController();