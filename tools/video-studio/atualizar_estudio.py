"""Copy reviewed application files into an existing Studio, preserving user data."""
from datetime import datetime
from pathlib import Path
import shutil

FILES = ['INICIAR.bat', 'INSTALAR.bat', 'INSTALAR_TRANSCRICAO.bat', 'INSTALAR_MINHA_VOZ.bat',
         'engine.py', 'studio.py', 'planner.py', 'media.py', 'mpt-export.py', 'voice_profiles.py',
         'voice_backend.py', 'voice_worker.py', 'requirements.txt', 'requirements-voice.txt',
         'README.md', 'MINHA_VOZ_LEIA-ME.txt', 'LICENSE', 'vendor/subtitle_reader.py',
         'vendor/LICENSE-MoneyPrinterTurbo.txt', 'vendor/README.md', 'examples/escola-base.json']


def update(destination):
    source = Path(__file__).resolve().parent
    target = Path(destination).expanduser().resolve()
    if source == target:
        raise ValueError('Escolha a pasta do Studio antigo, não a pasta desta atualização.')
    if not (target/'studio.py').is_file() or not (target/'INICIAR.bat').is_file():
        raise ValueError('Esta não parece ser a pasta do Studio. Escolha a que contém INICIAR e studio.py.')
    for name in FILES:
        if not (source/name).is_file():
            raise ValueError('Extraia o ZIP completo antes de atualizar. Falta: '+name)
    backup = target/('_backup_atualizacao_'+datetime.now().strftime('%Y%m%d_%H%M%S_%f'))
    backup.mkdir()
    for name in FILES:
        dest = target/name
        if dest.is_file():
            old = backup/name; old.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(dest, old)
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source/name, dest)
    return backup


if __name__ == '__main__':
    print('Feche o Studio antes de continuar. Projetos, vozes e ambientes serão preservados.')
    try:
        import tkinter as tk
        from tkinter import filedialog
        window=tk.Tk(); window.withdraw()
        path=filedialog.askdirectory(title='Selecione a pasta do Studio ANTIGO, onde está INICIAR.bat')
        window.destroy()
        if not path:
            print('Atualização cancelada. Nenhum arquivo foi alterado.')
            raise SystemExit(0)
    except ImportError:
        path=input('Cole o caminho da pasta do Studio antigo e pressione Enter: ').strip().strip('"')
    try:
        backup = update(path)
        print('Atualização concluída. Backup dos arquivos anteriores:', backup)
        print('Na pasta antiga, execute INSTALAR_MINHA_VOZ.bat uma vez e depois INICIAR.bat.')
    except (OSError, ValueError) as exc:
        print('Não foi possível concluir a atualização:', exc)
        raise SystemExit(1)
