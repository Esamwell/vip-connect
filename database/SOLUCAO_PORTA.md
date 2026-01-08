# ✅ Solução: Porta do PostgreSQL

## 🔍 Problema Identificado

O PostgreSQL está configurado para usar a **porta 5433**, não a porta padrão 5432.

## 🔧 Solução no Beekeeper

No Beekeeper Studio, altere a configuração:

### Configuração Correta:

```
Connection Type: Postgres
Authentication Method: Username / Password
Connection Mode: Host and Port
Host: localhost
Port: 5433  ⬅️ MUDE PARA 5433
Enable SSL: OFF
User: clientvipasi
Password: 1923731sS$
Default Database: (deixe vazio ou "postgres")
SSH Tunnel: OFF
Read Only Mode: (desmarcado)
```

## 📝 Passos:

1. Abra a conexão "VIP Connect" no Beekeeper
2. Altere o campo **Port** de `5432` para `5433`
3. Clique em **"Test"** para verificar
4. Se funcionar, clique em **"Connect"**

## ✅ Teste Rápido

Depois de alterar, você pode testar também pelo terminal:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -p 5433 -d postgres
```

---

**Isso deve resolver o problema de conexão!** 🎉

