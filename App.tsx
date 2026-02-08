const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);

    // On crée un petit délai pour s'assurer que le DOM est prêt
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const element = printRef.current;
      
      // Configuration optimale pour html2canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Haute définition
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        // Force la largeur pour éviter le rognage mobile
        windowWidth: 1200, 
        // Capture toute la hauteur du contenu, pas seulement ce qui est visible
        height: element.scrollHeight,
        y: 0,
        scrollX: 0,
        scrollY: 0
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Initialisation du PDF en A4 Paysage
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 297
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 210
      
      const imgProps = pdf.getImageProperties(imgData);
      const contentHeightInPdf = (imgProps.height * pdfWidth) / imgProps.width;

      // GESTION DU MULTI-PAGES :
      // On découpe l'image si elle est plus haute que la page A4
      let heightLeft = contentHeightInPdf;
      let position = 0;

      // Page 1
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, contentHeightInPdf);
      heightLeft -= pdfHeight;

      // Pages suivantes si nécessaire (si les fiches techniques dépassent)
      while (heightLeft > 0) {
        position = heightLeft - contentHeightInPdf;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, contentHeightInPdf);
        heightLeft -= pdfHeight;
      }

      pdf.save(`PLANNING-PROD-${format(currentWeekStart, 'dd-MM')}.pdf`);
    } catch (e) {
      console.error("Erreur génération PDF:", e);
      alert("Erreur lors de la création du PDF. Réessayez.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };