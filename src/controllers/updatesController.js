const Update = require('../models/schema');

function runUpload(req, res, callback) {
  const upload = req.app.locals.upload;
  upload.single('photo')(req, res, callback);
}

exports.addUpdate = (req, res) => {
  runUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    try {
      const {
        date,
        siteName,
        workDone,
        numberOfWorkers,
        materialsUsed,
        progressPercentage,
      } = req.body;

      if (!date || !siteName || !workDone || !numberOfWorkers || !materialsUsed || !progressPercentage) {
        return res.status(400).json({ message: 'All fields are required!' });
      }

      const photoPath = req.file ? '/uploads/' + req.file.filename : '';

      const newUpdate = new Update({
        date,
        siteName,
        workDone,
        numberOfWorkers,
        materialsUsed,
        progressPercentage,
        photoPath,
      });

      await newUpdate.save();
      res.status(201).json({ message: 'Update saved successfully!', data: newUpdate });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error. Could not save update.' });
    }
  });
};

exports.getUpdates = async (req, res) => {
  try {
    const updates = await Update.find({}).sort({ createdAt: -1 });
    res.status(200).json(updates);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteUpdate = async (req, res) => {
  try {
    const deleted = await Update.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Update not found!' });

    res.status(200).json({ message: 'Deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateUpdate = (req, res) => {
  runUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    try {
      const {
        date,
        siteName,
        workDone,
        numberOfWorkers,
        materialsUsed,
        progressPercentage,
      } = req.body;

      if (!date || !siteName || !workDone || !numberOfWorkers || !materialsUsed || !progressPercentage) {
        return res.status(400).json({ message: 'All fields are required!' });
      }

      const updateData = {
        date,
        siteName,
        workDone,
        numberOfWorkers,
        materialsUsed,
        progressPercentage,
      };

      if (req.file) updateData.photoPath = '/uploads/' + req.file.filename;

      const updated = await Update.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (!updated) return res.status(404).json({ message: 'Update not found!' });

      res.status(200).json({ message: 'Updated successfully!', data: updated });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  });
};

exports.getSiteProgress = async (req, res) => {
  try {
    const updates = await Update.find({}).sort({ createdAt: -1 });

    const siteMap = {};
    updates.forEach((u) => {
      if (!siteMap[u.siteName]) {
        siteMap[u.siteName] = u;
      }
    });

    const siteProgress = Object.values(siteMap);
    res.status(200).json(siteProgress);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
